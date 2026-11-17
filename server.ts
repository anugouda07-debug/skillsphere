import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { db, initSchema } from './server/db.ts';
import {
  attachOptionalUser,
  authRateLimit,
  COOKIE_NAME,
  getSafeUserById,
  hashPassword,
  requireAuth,
  signToken,
  verifyPassword,
  type AuthenticatedRequest,
} from './server/auth.ts';
import { seedDatabaseIfEmpty } from './server/seed.ts';

initSchema();
seedDatabaseIfEmpty();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

// CORS headers aligned for local/preview access
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

const VALID_CATEGORIES = ['Student', 'Graduate', 'Professional', 'Entrepreneur'] as const;
const VALID_PROFICIENCY = ['Beginner', 'Intermediate', 'Advanced'] as const;
const VALID_POST_TYPES = ['Question', 'Knowledge Share', 'Learning Experience'] as const;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setSessionCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/',
  });
}

function sanitizeUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/src/assets/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
    return '';
  } catch {
    return '';
  }
}

// ---------- AUTHENTICATION ROUTES ----------

app.post('/api/auth/register', authRateLimit(20), (req: Request, res: Response) => {
  const { full_name, email, password, category, headline } = req.body ?? {};
  const cleanName = typeof full_name === 'string' ? full_name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanPassword = typeof password === 'string' ? password : '';
  const cleanHeadline = typeof headline === 'string' ? headline.trim() : '';

  if (cleanName.length < 2 || cleanName.length > 80) {
    res.status(400).json({ error: 'Full name must be between 2 and 80 characters.' });
    return;
  }
  if (!isValidEmail(cleanEmail)) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }
  if (cleanPassword.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }
  if (!VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: 'Please select a valid user category.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const pwHash = hashPassword(cleanPassword);
  const createTx = db.transaction(() => {
    const userRes = db
      .prepare(
        'INSERT INTO users (full_name, email, password_hash, category, is_demo) VALUES (?, ?, ?, ?, 0)'
      )
      .run(cleanName, cleanEmail, pwHash, category);
    const userId = Number(userRes.lastInsertRowid);
    db.prepare(
      'INSERT INTO profiles (user_id, headline, bio, education_or_role) VALUES (?, ?, ?, ?)'
    ).run(
      userId,
      cleanHeadline || `${category} on SkillSphere`,
      '',
      category === 'Student'
        ? 'Undergraduate / Learner'
        : category === 'Graduate'
          ? 'Recent Graduate'
          : category === 'Professional'
            ? 'Working Professional'
            : 'Founder / Entrepreneur'
    );
    return userId;
  });

  const userId = createTx();
  const user = getSafeUserById(userId)!;
  const token = signToken(userId);
  setSessionCookie(res, token);
  res.status(201).json({ user, token });
});

app.post('/api/auth/login', authRateLimit(25), (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanPassword = typeof password === 'string' ? password : '';

  if (!cleanEmail || !cleanPassword) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const row = db
    .prepare('SELECT id, password_hash FROM users WHERE email = ?')
    .get(cleanEmail) as { id: number; password_hash: string } | undefined;

  if (!row || !verifyPassword(cleanPassword, row.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const user = getSafeUserById(row.id)!;
  const token = signToken(row.id);
  setSessionCookie(res, token);
  res.json({ user, token });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ message: 'Logged out successfully.' });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const profile = db
    .prepare('SELECT * FROM profiles WHERE user_id = ?')
    .get(req.user!.id);
  res.json({ user: req.user, profile });
});

app.patch('/api/auth/settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { full_name, category, current_password, new_password } = req.body ?? {};
  const userId = req.user!.id;

  if (new_password !== undefined && new_password !== '') {
    if (typeof new_password !== 'string' || new_password.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters.' });
      return;
    }
    const row = db
      .prepare('SELECT password_hash FROM users WHERE id = ?')
      .get(userId) as { password_hash: string };
    if (
      typeof current_password !== 'string' ||
      !verifyPassword(current_password, row.password_hash)
    ) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(
      hashPassword(new_password),
      userId
    );
  }

  if (full_name !== undefined) {
    const cleanName = typeof full_name === 'string' ? full_name.trim() : '';
    if (cleanName.length < 2 || cleanName.length > 80) {
      res.status(400).json({ error: 'Full name must be between 2 and 80 characters.' });
      return;
    }
    db.prepare("UPDATE users SET full_name = ?, updated_at = datetime('now') WHERE id = ?").run(
      cleanName,
      userId
    );
  }

  if (category !== undefined) {
    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: 'Invalid user category.' });
      return;
    }
    db.prepare("UPDATE users SET category = ?, updated_at = datetime('now') WHERE id = ?").run(
      category,
      userId
    );
  }

  res.json({ user: getSafeUserById(userId) });
});

// ---------- PROFILE ROUTES ----------

app.get('/api/profile/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  const skills = db
    .prepare(
      `SELECT us.id, us.skill_id, s.name, s.category, us.proficiency_level
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?
       ORDER BY s.name ASC`
    )
    .all(userId);
  const projects = db
    .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId);

  res.json({ user: req.user, profile, skills, projects });
});

app.put('/api/profile/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    full_name,
    category,
    headline,
    bio,
    avatar_url,
    education_or_role,
    organization,
    location,
    interests,
    achievements,
    github_url,
    linkedin_url,
    website_url,
  } = req.body ?? {};

  if (full_name !== undefined) {
    const cleanName = String(full_name).trim();
    if (cleanName.length < 2 || cleanName.length > 80) {
      res.status(400).json({ error: 'Full name must be between 2 and 80 characters.' });
      return;
    }
    db.prepare("UPDATE users SET full_name = ?, updated_at = datetime('now') WHERE id = ?").run(
      cleanName,
      userId
    );
  }

  if (category !== undefined && VALID_CATEGORIES.includes(category)) {
    db.prepare("UPDATE users SET category = ?, updated_at = datetime('now') WHERE id = ?").run(
      category,
      userId
    );
  }

  db.prepare(
    `UPDATE profiles SET
      headline = ?,
      bio = ?,
      avatar_url = ?,
      education_or_role = ?,
      organization = ?,
      location = ?,
      interests = ?,
      achievements = ?,
      github_url = ?,
      linkedin_url = ?,
      website_url = ?,
      updated_at = datetime('now')
    WHERE user_id = ?`
  ).run(
    String(headline ?? '').trim().slice(0, 180),
    String(bio ?? '').trim().slice(0, 2000),
    sanitizeUrl(avatar_url),
    String(education_or_role ?? '').trim().slice(0, 140),
    String(organization ?? '').trim().slice(0, 140),
    String(location ?? '').trim().slice(0, 100),
    String(interests ?? '').trim().slice(0, 300),
    String(achievements ?? '').trim().slice(0, 800),
    sanitizeUrl(github_url),
    sanitizeUrl(linkedin_url),
    sanitizeUrl(website_url),
    userId
  );

  const updatedProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  res.json({ user: getSafeUserById(userId), profile: updatedProfile });
});

app.get('/api/profiles/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const targetId = Number(req.params.id);
  const user = getSafeUserById(targetId);
  if (!user) {
    res.status(404).json({ error: 'Member profile not found.' });
    return;
  }
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(targetId);
  const skills = db
    .prepare(
      `SELECT us.id, us.skill_id, s.name, s.category, us.proficiency_level
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?
       ORDER BY s.name ASC`
    )
    .all(targetId);
  const projects = db
    .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC')
    .all(targetId);
  res.json({ user, profile, skills, projects });
});

// ---------- SKILLS ROUTES ----------

app.get('/api/skills', (req: Request, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';

  let sql = 'SELECT * FROM skills WHERE 1=1';
  const params: unknown[] = [];

  if (q) {
    sql += ' AND (LOWER(name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category && category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY category ASC, name ASC';

  const skills = db.prepare(sql).all(...params);
  res.json({ skills });
});

app.post('/api/skills', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, category, description } = req.body ?? {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanCategory = typeof category === 'string' ? category.trim() : '';
  const cleanDesc = typeof description === 'string' ? description.trim() : '';

  if (cleanName.length < 2 || cleanName.length > 60) {
    res.status(400).json({ error: 'Skill name must be 2 to 60 characters.' });
    return;
  }
  if (!cleanCategory) {
    res.status(400).json({ error: 'Skill category is required.' });
    return;
  }

  const existing = db
    .prepare('SELECT * FROM skills WHERE LOWER(name) = LOWER(?)')
    .get(cleanName);
  if (existing) {
    res.json({ skill: existing });
    return;
  }

  const result = db
    .prepare('INSERT INTO skills (name, category, description) VALUES (?, ?, ?)')
    .run(cleanName, cleanCategory, cleanDesc.slice(0, 240));
  const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ skill });
});

app.get('/api/user-skills', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const rows = db
    .prepare(
      `SELECT us.id, us.skill_id, us.proficiency_level, us.created_at, s.name, s.category, s.description
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?
       ORDER BY us.created_at DESC`
    )
    .all(req.user!.id);
  res.json({ user_skills: rows });
});

app.post('/api/user-skills', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { skill_id, proficiency_level } = req.body ?? {};
  const skillIdNum = Number(skill_id);
  const level = VALID_PROFICIENCY.includes(proficiency_level)
    ? proficiency_level
    : 'Intermediate';

  const skill = db.prepare('SELECT id FROM skills WHERE id = ?').get(skillIdNum);
  if (!skill) {
    res.status(404).json({ error: 'Skill not found.' });
    return;
  }

  db.prepare(
    `INSERT INTO user_skills (user_id, skill_id, proficiency_level)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, skill_id) DO UPDATE SET proficiency_level = excluded.proficiency_level`
  ).run(req.user!.id, skillIdNum, level);

  const saved = db
    .prepare(
      `SELECT us.id, us.skill_id, us.proficiency_level, us.created_at, s.name, s.category, s.description
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ? AND us.skill_id = ?`
    )
    .get(req.user!.id, skillIdNum);

  res.status(201).json({ user_skill: saved });
});

app.delete('/api/user-skills/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = db
    .prepare('SELECT id, user_id FROM user_skills WHERE id = ?')
    .get(id) as { id: number; user_id: number } | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Skill entry not found.' });
    return;
  }
  if (existing.user_id !== req.user!.id) {
    res.status(403).json({ error: 'You can only remove skills from your own profile.' });
    return;
  }

  db.prepare('DELETE FROM user_skills WHERE id = ?').run(id);
  res.json({ deleted: true });
});

// ---------- LEARNING ROADMAPS & PROGRESS ROUTES ----------

app.get('/api/roadmaps', attachOptionalUser, (req: AuthenticatedRequest, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const userId = req.user?.id ?? null;

  let sql = 'SELECT * FROM learning_roadmaps WHERE 1=1';
  const params: unknown[] = [];
  if (q) {
    sql += ' AND (LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category && category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY id ASC';

  const roadmaps = db.prepare(sql).all(...params) as Array<{
    id: number;
    title: string;
    category: string;
    difficulty: string;
    estimated_hours: number;
    description: string;
  }>;

  const stepCountStmt = db.prepare(
    'SELECT COUNT(*) as c FROM roadmap_steps WHERE roadmap_id = ?'
  );
  const completedCountStmt = db.prepare(
    `SELECT COUNT(*) as c
     FROM user_learning_progress ulp
     JOIN roadmap_steps rs ON rs.id = ulp.step_id
     WHERE ulp.user_id = ? AND rs.roadmap_id = ? AND ulp.status = 'completed'`
  );

  const enriched = roadmaps.map((rm) => {
    const totalSteps = (stepCountStmt.get(rm.id) as { c: number }).c;
    const completedSteps = userId
      ? (completedCountStmt.get(userId, rm.id) as { c: number }).c
      : 0;
    const progressPercent =
      totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    return {
      ...rm,
      total_steps: totalSteps,
      completed_steps: completedSteps,
      progress_percent: progressPercent,
    };
  });

  res.json({ roadmaps: enriched });
});

app.get('/api/roadmaps/:id', attachOptionalUser, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const roadmap = db.prepare('SELECT * FROM learning_roadmaps WHERE id = ?').get(id);
  if (!roadmap) {
    res.status(404).json({ error: 'Learning roadmap not found.' });
    return;
  }

  if (req.user) {
    db.prepare(
      `INSERT INTO roadmap_views (user_id, roadmap_id, viewed_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id, roadmap_id) DO UPDATE SET viewed_at = datetime('now')`
    ).run(req.user.id, id);
  }

  const steps = db
    .prepare('SELECT * FROM roadmap_steps WHERE roadmap_id = ? ORDER BY step_order ASC, id ASC')
    .all(id) as Array<{
    id: number;
    roadmap_id: number;
    step_order: number;
    title: string;
    description: string;
    resource_title: string;
    resource_url: string;
    estimated_minutes: number;
  }>;

  const completedMap = new Map<number, string | null>();
  if (req.user) {
    const progRows = db
      .prepare(
        `SELECT ulp.step_id, ulp.status, ulp.completed_at
         FROM user_learning_progress ulp
         JOIN roadmap_steps rs ON rs.id = ulp.step_id
         WHERE ulp.user_id = ? AND rs.roadmap_id = ? AND ulp.status = 'completed'`
      )
      .all(req.user.id, id) as Array<{ step_id: number; completed_at: string | null }>;
    for (const r of progRows) {
      completedMap.set(r.step_id, r.completed_at);
    }
  }

  const stepsWithStatus = steps.map((s) => ({
    ...s,
    status: completedMap.has(s.id) ? 'completed' : 'pending',
    completed_at: completedMap.get(s.id) ?? null,
  }));

  const completedSteps = stepsWithStatus.filter((s) => s.status === 'completed').length;
  const totalSteps = stepsWithStatus.length;
  const progressPercent =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  res.json({
    roadmap,
    steps: stepsWithStatus,
    total_steps: totalSteps,
    completed_steps: completedSteps,
    progress_percent: progressPercent,
  });
});

app.post('/api/roadmaps/:id/steps', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const roadmapId = Number(req.params.id);
  const roadmap = db.prepare('SELECT id FROM learning_roadmaps WHERE id = ?').get(roadmapId);
  if (!roadmap) {
    res.status(404).json({ error: 'Learning roadmap not found.' });
    return;
  }

  const { title, description, resource_title, resource_url, estimated_minutes } = req.body ?? {};
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  const cleanDesc = typeof description === 'string' ? description.trim() : '';
  const cleanResTitle = typeof resource_title === 'string' ? resource_title.trim() : '';
  const cleanResUrl = sanitizeUrl(resource_url);
  const mins = Math.max(10, Math.min(360, Number(estimated_minutes) || 45));

  if (cleanTitle.length < 3 || cleanTitle.length > 140) {
    res.status(400).json({ error: 'Step title must be between 3 and 140 characters.' });
    return;
  }
  if (cleanDesc.length < 8) {
    res.status(400).json({ error: 'Step description must be at least 8 characters.' });
    return;
  }

  const maxOrderRow = db
    .prepare('SELECT COALESCE(MAX(step_order), 0) as max_order FROM roadmap_steps WHERE roadmap_id = ?')
    .get(roadmapId) as { max_order: number };

  const result = db
    .prepare(
      `INSERT INTO roadmap_steps (
        roadmap_id, step_order, title, description, resource_title, resource_url, estimated_minutes, added_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      roadmapId,
      maxOrderRow.max_order + 1,
      cleanTitle,
      cleanDesc.slice(0, 600),
      cleanResTitle.slice(0, 120),
      cleanResUrl,
      mins,
      req.user!.id
    );

  const step = db.prepare('SELECT * FROM roadmap_steps WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ step });
});

app.get('/api/progress', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const roadmaps = db
    .prepare('SELECT * FROM learning_roadmaps ORDER BY id ASC')
    .all() as Array<{
    id: number;
    title: string;
    category: string;
    difficulty: string;
    estimated_hours: number;
    description: string;
  }>;

  const stepsStmt = db.prepare(
    `SELECT rs.id, rs.title, rs.step_order, rs.estimated_minutes,
            COALESCE(ulp.status, 'pending') as status, ulp.completed_at
     FROM roadmap_steps rs
     LEFT JOIN user_learning_progress ulp
       ON ulp.step_id = rs.id AND ulp.user_id = ?
     WHERE rs.roadmap_id = ?
     ORDER BY rs.step_order ASC`
  );

  const pathways = roadmaps.map((rm) => {
    const steps = stepsStmt.all(userId, rm.id) as Array<{
      id: number;
      title: string;
      step_order: number;
      estimated_minutes: number;
      status: string;
      completed_at: string | null;
    }>;
    const total = steps.length;
    const completed = steps.filter((s) => s.status === 'completed').length;
    return {
      ...rm,
      total_steps: total,
      completed_steps: completed,
      pending_steps: total - completed,
      progress_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      steps,
    };
  });

  const totalCompletedSteps = pathways.reduce((acc, p) => acc + p.completed_steps, 0);
  const totalSteps = pathways.reduce((acc, p) => acc + p.total_steps, 0);

  res.json({
    summary: {
      total_completed_steps: totalCompletedSteps,
      total_pending_steps: totalSteps - totalCompletedSteps,
      active_roadmaps: pathways.filter((p) => p.completed_steps > 0).length,
      overall_percent: totalSteps > 0 ? Math.round((totalCompletedSteps / totalSteps) * 100) : 0,
    },
    pathways,
  });
});

app.post('/api/progress', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { step_id, status } = req.body ?? {};
  const stepIdNum = Number(step_id);
  const nextStatus = status === 'pending' ? 'pending' : 'completed';

  const step = db
    .prepare('SELECT id, roadmap_id FROM roadmap_steps WHERE id = ?')
    .get(stepIdNum) as { id: number; roadmap_id: number } | undefined;
  if (!step) {
    res.status(404).json({ error: 'Roadmap step not found.' });
    return;
  }

  db.prepare(
    `INSERT INTO user_learning_progress (user_id, step_id, status, completed_at, updated_at)
     VALUES (?, ?, ?, CASE WHEN ? = 'completed' THEN datetime('now') ELSE NULL END, datetime('now'))
     ON CONFLICT(user_id, step_id) DO UPDATE SET
       status = excluded.status,
       completed_at = CASE WHEN excluded.status = 'completed' THEN datetime('now') ELSE NULL END,
       updated_at = datetime('now')`
  ).run(req.user!.id, stepIdNum, nextStatus, nextStatus);

  const counts = db
    .prepare(
      `SELECT
        COUNT(rs.id) as total,
        SUM(CASE WHEN ulp.status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM roadmap_steps rs
       LEFT JOIN user_learning_progress ulp
         ON ulp.step_id = rs.id AND ulp.user_id = ?
       WHERE rs.roadmap_id = ?`
    )
    .get(req.user!.id, step.roadmap_id) as { total: number; completed: number };

  res.json({
    step_id: stepIdNum,
    status: nextStatus,
    roadmap_id: step.roadmap_id,
    completed_steps: counts.completed,
    total_steps: counts.total,
    progress_percent: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
  });
});

// ---------- PORTFOLIO PROJECTS ROUTES ----------

app.get('/api/projects', attachOptionalUser, (req: AuthenticatedRequest, res: Response) => {
  const scope = req.query.scope === 'all' ? 'all' : 'mine';
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  let sql = `
    SELECT p.*, u.full_name as owner_name, u.category as owner_category, u.is_demo as owner_is_demo,
           pr.headline as owner_headline, pr.avatar_url as owner_avatar
    FROM projects p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN profiles pr ON pr.user_id = u.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (scope === 'mine') {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required to view personal portfolio.' });
      return;
    }
    sql += ' AND p.user_id = ?';
    params.push(req.user.id);
  }

  if (q) {
    sql +=
      ' AND (LOWER(p.title) LIKE LOWER(?) OR LOWER(p.technologies) LIKE LOWER(?) OR LOWER(p.summary) LIKE LOWER(?))';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  sql += ' ORDER BY p.updated_at DESC, p.id DESC';
  const projects = db.prepare(sql).all(...params);
  res.json({ projects });
});

app.get('/api/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const project = db
    .prepare(
      `SELECT p.*, u.full_name as owner_name, u.category as owner_category, u.is_demo as owner_is_demo,
              pr.headline as owner_headline, pr.avatar_url as owner_avatar, pr.organization as owner_organization
       FROM projects p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN profiles pr ON pr.user_id = u.id
       WHERE p.id = ?`
    )
    .get(id);

  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ project });
});

app.post('/api/projects', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, summary, description, technologies, thumbnail_url, github_url, live_url } =
    req.body ?? {};
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  const cleanSummary = typeof summary === 'string' ? summary.trim() : '';
  const cleanDesc = typeof description === 'string' ? description.trim() : '';
  const cleanTech = typeof technologies === 'string' ? technologies.trim() : '';

  if (cleanTitle.length < 3 || cleanTitle.length > 120) {
    res.status(400).json({ error: 'Project title must be between 3 and 120 characters.' });
    return;
  }
  if (cleanDesc.length < 15) {
    res.status(400).json({ error: 'Project description must be at least 15 characters.' });
    return;
  }

  const result = db
    .prepare(
      `INSERT INTO projects (
        user_id, title, summary, description, technologies, thumbnail_url, github_url, live_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user!.id,
      cleanTitle,
      cleanSummary.slice(0, 220),
      cleanDesc.slice(0, 4000),
      cleanTech.slice(0, 240),
      sanitizeUrl(thumbnail_url),
      sanitizeUrl(github_url),
      sanitizeUrl(live_url)
    );

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ project });
});

app.put('/api/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = db
    .prepare('SELECT id, user_id FROM projects WHERE id = ?')
    .get(id) as { id: number; user_id: number } | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  if (existing.user_id !== req.user!.id) {
    res.status(403).json({ error: 'You can only edit your own portfolio projects.' });
    return;
  }

  const { title, summary, description, technologies, thumbnail_url, github_url, live_url } =
    req.body ?? {};
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  const cleanDesc = typeof description === 'string' ? description.trim() : '';

  if (cleanTitle.length < 3 || cleanTitle.length > 120) {
    res.status(400).json({ error: 'Project title must be between 3 and 120 characters.' });
    return;
  }
  if (cleanDesc.length < 15) {
    res.status(400).json({ error: 'Project description must be at least 15 characters.' });
    return;
  }

  db.prepare(
    `UPDATE projects SET
      title = ?,
      summary = ?,
      description = ?,
      technologies = ?,
      thumbnail_url = ?,
      github_url = ?,
      live_url = ?,
      updated_at = datetime('now')
    WHERE id = ?`
  ).run(
    cleanTitle,
    String(summary ?? '').trim().slice(0, 220),
    cleanDesc.slice(0, 4000),
    String(technologies ?? '').trim().slice(0, 240),
    sanitizeUrl(thumbnail_url),
    sanitizeUrl(github_url),
    sanitizeUrl(live_url),
    id
  );

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json({ project });
});

app.delete('/api/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = db
    .prepare('SELECT id, user_id FROM projects WHERE id = ?')
    .get(id) as { id: number; user_id: number } | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  if (existing.user_id !== req.user!.id) {
    res.status(403).json({ error: 'You can only delete your own portfolio projects.' });
    return;
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.json({ deleted: true });
});

// ---------- KNOWLEDGE COMMUNITY ROUTES ----------

const postCooldowns = new Map<number, number>();

app.get('/api/posts', attachOptionalUser, (req: AuthenticatedRequest, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const type = typeof req.query.type === 'string' ? req.query.type.trim() : '';

  let sql = `
    SELECT p.*, u.full_name as author_name, u.category as author_category, u.is_demo as author_is_demo,
           pr.headline as author_headline, pr.avatar_url as author_avatar,
           (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN profiles pr ON pr.user_id = u.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (q) {
    sql +=
      ' AND (LOWER(p.title) LIKE LOWER(?) OR LOWER(p.content) LIKE LOWER(?) OR LOWER(p.tags) LIKE LOWER(?))';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (type && type !== 'All') {
    sql += ' AND p.post_type = ?';
    params.push(type);
  }

  sql += ' ORDER BY p.last_activity_at DESC, p.id DESC';
  const posts = db.prepare(sql).all(...params);
  res.json({ posts });
});

app.get('/api/posts/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const post = db
    .prepare(
      `SELECT p.*, u.full_name as author_name, u.category as author_category, u.is_demo as author_is_demo,
              pr.headline as author_headline, pr.avatar_url as author_avatar, pr.organization as author_organization
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN profiles pr ON pr.user_id = u.id
       WHERE p.id = ?`
    )
    .get(id);

  if (!post) {
    res.status(404).json({ error: 'Community post not found.' });
    return;
  }

  const comments = db
    .prepare(
      `SELECT c.*, u.full_name as author_name, u.category as author_category, u.is_demo as author_is_demo,
              pr.headline as author_headline, pr.avatar_url as author_avatar
       FROM comments c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN profiles pr ON pr.user_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC, c.id ASC`
    )
    .all(id);

  res.json({ post, comments });
});

app.post('/api/posts', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const lastPostTs = postCooldowns.get(userId) || 0;
  if (Date.now() - lastPostTs < 8000) {
    res.status(429).json({ error: 'Please wait a few seconds before publishing another post.' });
    return;
  }

  const { post_type, title, content, tags } = req.body ?? {};
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  const cleanContent = typeof content === 'string' ? content.trim() : '';
  const cleanTags = typeof tags === 'string' ? tags.trim() : '';
  const validType = VALID_POST_TYPES.includes(post_type) ? post_type : 'Knowledge Share';

  if (cleanTitle.length < 5 || cleanTitle.length > 160) {
    res.status(400).json({ error: 'Post title must be between 5 and 160 characters.' });
    return;
  }
  if (cleanContent.length < 20) {
    res.status(400).json({ error: 'Post content must be at least 20 characters.' });
    return;
  }
  if (/https?:\/\/\S+.*https?:\/\/\S+.*https?:\/\/\S+/i.test(cleanContent)) {
    res.status(400).json({ error: 'Post flagged by spam filter: excessive external links.' });
    return;
  }

  const duplicate = db
    .prepare(
      "SELECT id FROM posts WHERE user_id = ? AND LOWER(title) = LOWER(?) AND created_at > datetime('now', '-5 minutes')"
    )
    .get(userId, cleanTitle);
  if (duplicate) {
    res.status(409).json({ error: 'You recently published a post with this exact title.' });
    return;
  }

  postCooldowns.set(userId, Date.now());
  const result = db
    .prepare(
      'INSERT INTO posts (user_id, post_type, title, content, tags) VALUES (?, ?, ?, ?, ?)'
    )
    .run(userId, validType, cleanTitle, cleanContent.slice(0, 5000), cleanTags.slice(0, 200));

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ post });
});

app.delete('/api/posts/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = db
    .prepare('SELECT id, user_id FROM posts WHERE id = ?')
    .get(id) as { id: number; user_id: number } | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Post not found.' });
    return;
  }
  if (existing.user_id !== req.user!.id) {
    res.status(403).json({ error: 'You can only delete your own posts.' });
    return;
  }
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  res.json({ deleted: true });
});

app.post('/api/posts/:id/comments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const postId = Number(req.params.id);
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
  if (!post) {
    res.status(404).json({ error: 'Post not found.' });
    return;
  }

  const { content } = req.body ?? {};
  const cleanContent = typeof content === 'string' ? content.trim() : '';
  if (cleanContent.length < 3 || cleanContent.length > 2000) {
    res.status(400).json({ error: 'Comment must be between 3 and 2000 characters.' });
    return;
  }

  const dup = db
    .prepare(
      "SELECT id FROM comments WHERE post_id = ? AND user_id = ? AND content = ? AND created_at > datetime('now', '-1 minute')"
    )
    .get(postId, req.user!.id, cleanContent);
  if (dup) {
    res.status(409).json({ error: 'Duplicate comment detected.' });
    return;
  }

  const tx = db.transaction(() => {
    const resInsert = db
      .prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)')
      .run(postId, req.user!.id, cleanContent);
    db.prepare("UPDATE posts SET last_activity_at = datetime('now') WHERE id = ?").run(postId);
    return Number(resInsert.lastInsertRowid);
  });

  const commentId = tx();
  const comment = db
    .prepare(
      `SELECT c.*, u.full_name as author_name, u.category as author_category, u.is_demo as author_is_demo,
              pr.headline as author_headline, pr.avatar_url as author_avatar
       FROM comments c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN profiles pr ON pr.user_id = u.id
       WHERE c.id = ?`
    )
    .get(commentId);

  res.status(201).json({ comment });
});

// ---------- COLLABORATION HUB ROUTES ----------

app.get('/api/collaborations', attachOptionalUser, (req: AuthenticatedRequest, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

  let sql = `
    SELECT cp.*, u.full_name as owner_name, u.category as owner_category, u.is_demo as owner_is_demo,
           pr.headline as owner_headline, pr.avatar_url as owner_avatar,
           (SELECT COUNT(*) FROM project_members pm WHERE pm.collaboration_id = cp.id) as member_count
    FROM collaboration_projects cp
    JOIN users u ON u.id = cp.owner_id
    LEFT JOIN profiles pr ON pr.user_id = u.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (q) {
    sql +=
      ' AND (LOWER(cp.title) LIKE LOWER(?) OR LOWER(cp.description) LIKE LOWER(?) OR LOWER(cp.required_skills) LIKE LOWER(?))';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (category && category !== 'All') {
    sql += ' AND cp.category = ?';
    params.push(category);
  }
  if (status && status !== 'All') {
    sql += ' AND cp.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY cp.created_at DESC, cp.id DESC';
  const collaborations = db.prepare(sql).all(...params);
  res.json({ collaborations });
});

app.get('/api/collaborations/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const collaboration = db
    .prepare(
      `SELECT cp.*, u.full_name as owner_name, u.category as owner_category, u.is_demo as owner_is_demo,
              pr.headline as owner_headline, pr.avatar_url as owner_avatar, pr.organization as owner_organization
       FROM collaboration_projects cp
       JOIN users u ON u.id = cp.owner_id
       LEFT JOIN profiles pr ON pr.user_id = u.id
       WHERE cp.id = ?`
    )
    .get(id) as { owner_id: number } | undefined;

  if (!collaboration) {
    res.status(404).json({ error: 'Collaboration project not found.' });
    return;
  }

  const members = db
    .prepare(
      `SELECT pm.id, pm.user_id, pm.role, pm.joined_at, u.full_name, u.category, u.is_demo,
              pr.headline, pr.avatar_url
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       LEFT JOIN profiles pr ON pr.user_id = u.id
       WHERE pm.collaboration_id = ?
       ORDER BY pm.joined_at ASC`
    )
    .all(id);

  const myRequest = db
    .prepare(
      'SELECT * FROM collaboration_requests WHERE collaboration_id = ? AND requester_id = ?'
    )
    .get(id, req.user!.id);

  const isOwner = collaboration.owner_id === req.user!.id;
  const requests = isOwner
    ? db
        .prepare(
          `SELECT cr.*, u.full_name as requester_name, u.category as requester_category,
                  pr.headline as requester_headline, pr.avatar_url as requester_avatar
           FROM collaboration_requests cr
           JOIN users u ON u.id = cr.requester_id
           LEFT JOIN profiles pr ON pr.user_id = u.id
           WHERE cr.collaboration_id = ?
           ORDER BY cr.created_at DESC`
        )
        .all(id)
    : [];

  res.json({ collaboration, members, my_request: myRequest ?? null, requests });
});

app.post('/api/collaborations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, description, category, required_skills, team_size } = req.body ?? {};
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  const cleanDesc = typeof description === 'string' ? description.trim() : '';
  const cleanCategory = typeof category === 'string' ? category.trim() : '';
  const cleanSkills = typeof required_skills === 'string' ? required_skills.trim() : '';
  const size = Math.max(2, Math.min(20, Number(team_size) || 4));

  if (cleanTitle.length < 4 || cleanTitle.length > 140) {
    res.status(400).json({ error: 'Project title must be between 4 and 140 characters.' });
    return;
  }
  if (cleanDesc.length < 20) {
    res.status(400).json({ error: 'Description must be at least 20 characters.' });
    return;
  }
  if (!cleanCategory) {
    res.status(400).json({ error: 'Category is required.' });
    return;
  }
  if (!cleanSkills) {
    res.status(400).json({ error: 'Please list required skills.' });
    return;
  }

  const tx = db.transaction(() => {
    const insertRes = db
      .prepare(
        `INSERT INTO collaboration_projects (owner_id, title, description, category, required_skills, team_size, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Open')`
      )
      .run(req.user!.id, cleanTitle, cleanDesc.slice(0, 4000), cleanCategory, cleanSkills.slice(0, 300), size);
    const collabId = Number(insertRes.lastInsertRowid);
    db.prepare(
      'INSERT INTO project_members (collaboration_id, user_id, role) VALUES (?, ?, ?)'
    ).run(collabId, req.user!.id, 'Project Owner');
    return collabId;
  });

  const collabId = tx();
  const collaboration = db
    .prepare('SELECT * FROM collaboration_projects WHERE id = ?')
    .get(collabId);
  res.status(201).json({ collaboration });
});

app.get('/api/requests', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const incoming = db
    .prepare(
      `SELECT cr.*, cp.title as project_title, cp.category as project_category,
              u.full_name as requester_name, u.category as requester_category,
              pr.headline as requester_headline, pr.avatar_url as requester_avatar
       FROM collaboration_requests cr
       JOIN collaboration_projects cp ON cp.id = cr.collaboration_id
       JOIN users u ON u.id = cr.requester_id
       LEFT JOIN profiles pr ON pr.user_id = u.id
       WHERE cp.owner_id = ?
       ORDER BY CASE cr.status WHEN 'pending' THEN 0 ELSE 1 END, cr.created_at DESC`
    )
    .all(userId);

  const outgoing = db
    .prepare(
      `SELECT cr.*, cp.title as project_title, cp.category as project_category,
              u.full_name as owner_name, u.category as owner_category
       FROM collaboration_requests cr
       JOIN collaboration_projects cp ON cp.id = cr.collaboration_id
       JOIN users u ON u.id = cp.owner_id
       WHERE cr.requester_id = ?
       ORDER BY cr.created_at DESC`
    )
    .all(userId);

  res.json({ incoming, outgoing });
});

app.post(
  '/api/collaborations/:id/requests',
  requireAuth,
  (req: AuthenticatedRequest, res: Response) => {
    const collabId = Number(req.params.id);
    const userId = req.user!.id;
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    const collab = db
      .prepare('SELECT id, owner_id, status FROM collaboration_projects WHERE id = ?')
      .get(collabId) as { id: number; owner_id: number; status: string } | undefined;

    if (!collab) {
      res.status(404).json({ error: 'Collaboration project not found.' });
      return;
    }
    if (collab.owner_id === userId) {
      res.status(400).json({ error: 'You are already the owner of this project.' });
      return;
    }
    if (message.length < 10) {
      res.status(400).json({ error: 'Please include a short note (at least 10 characters) on how you can contribute.' });
      return;
    }

    const existingMember = db
      .prepare('SELECT id FROM project_members WHERE collaboration_id = ? AND user_id = ?')
      .get(collabId, userId);
    if (existingMember) {
      res.status(409).json({ error: 'You are already a member of this project team.' });
      return;
    }

    const existingReq = db
      .prepare(
        'SELECT id, status FROM collaboration_requests WHERE collaboration_id = ? AND requester_id = ?'
      )
      .get(collabId, userId) as { id: number; status: string } | undefined;

    if (existingReq) {
      res.status(409).json({
        error: `You have already submitted a request for this project (current status: ${existingReq.status}).`,
      });
      return;
    }

    const result = db
      .prepare(
        "INSERT INTO collaboration_requests (collaboration_id, requester_id, message, status) VALUES (?, ?, ?, 'pending')"
      )
      .run(collabId, userId, message.slice(0, 1000));

    const requestRow = db
      .prepare('SELECT * FROM collaboration_requests WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json({ request: requestRow });
  }
);

app.patch('/api/requests/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const reqId = Number(req.params.id);
  const { status } = req.body ?? {};
  if (status !== 'accepted' && status !== 'rejected') {
    res.status(400).json({ error: 'Status must be accepted or rejected.' });
    return;
  }

  const reqRow = db
    .prepare(
      `SELECT cr.*, cp.owner_id
       FROM collaboration_requests cr
       JOIN collaboration_projects cp ON cp.id = cr.collaboration_id
       WHERE cr.id = ?`
    )
    .get(reqId) as
    | {
        id: number;
        collaboration_id: number;
        requester_id: number;
        status: string;
        owner_id: number;
      }
    | undefined;

  if (!reqRow) {
    res.status(404).json({ error: 'Collaboration request not found.' });
    return;
  }
  if (reqRow.owner_id !== req.user!.id) {
    res.status(403).json({ error: 'Only the project owner can accept or reject requests.' });
    return;
  }

  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE collaboration_requests SET status = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(status, reqId);

    if (status === 'accepted') {
      db.prepare(
        `INSERT OR IGNORE INTO project_members (collaboration_id, user_id, role)
         VALUES (?, ?, 'Collaborator')`
      ).run(reqRow.collaboration_id, reqRow.requester_id);
    }
  });

  tx();
  const updated = db.prepare('SELECT * FROM collaboration_requests WHERE id = ?').get(reqId);
  res.json({ request: updated });
});

// ---------- DASHBOARD AGGREGATION ROUTE ----------

app.get('/api/dashboard', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  const skills = db
    .prepare(
      `SELECT us.id, us.skill_id, s.name, s.category, us.proficiency_level
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?
       ORDER BY s.name ASC`
    )
    .all(userId) as Array<{ name: string; category: string }>;

  const allRoadmaps = db
    .prepare('SELECT * FROM learning_roadmaps ORDER BY id ASC')
    .all() as Array<{
    id: number;
    title: string;
    category: string;
    difficulty: string;
    estimated_hours: number;
  }>;

  const stepCounts = db.prepare('SELECT COUNT(*) as c FROM roadmap_steps WHERE roadmap_id = ?');
  const completedCounts = db.prepare(
    `SELECT COUNT(*) as c
     FROM user_learning_progress ulp
     JOIN roadmap_steps rs ON rs.id = ulp.step_id
     WHERE ulp.user_id = ? AND rs.roadmap_id = ? AND ulp.status = 'completed'`
  );

  let totalSteps = 0;
  let totalCompleted = 0;
  const roadmapProgress = allRoadmaps.map((rm) => {
    const total = (stepCounts.get(rm.id) as { c: number }).c;
    const completed = (completedCounts.get(userId, rm.id) as { c: number }).c;
    totalSteps += total;
    totalCompleted += completed;
    return {
      ...rm,
      total_steps: total,
      completed_steps: completed,
      progress_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const recentlyViewed = db
    .prepare(
      `SELECT rm.*, rv.viewed_at
       FROM roadmap_views rv
       JOIN learning_roadmaps rm ON rm.id = rv.roadmap_id
       WHERE rv.user_id = ?
       ORDER BY rv.viewed_at DESC
       LIMIT 3`
    )
    .all(userId) as Array<{ id: number }>;

  const recentRoadmaps = (recentlyViewed.length > 0 ? recentlyViewed : allRoadmaps.slice(0, 3)).map(
    (r) => roadmapProgress.find((p) => p.id === r.id)!
  );

  const projects = db
    .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC LIMIT 4')
    .all(userId);

  const recentPosts = db
    .prepare(
      `SELECT p.*, u.full_name as author_name, u.category as author_category,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.last_activity_at DESC
       LIMIT 4`
    )
    .all();

  const openCollabs = db
    .prepare(
      `SELECT cp.*, u.full_name as owner_name, u.category as owner_category,
              (SELECT COUNT(*) FROM project_members pm WHERE pm.collaboration_id = cp.id) as member_count
       FROM collaboration_projects cp
       JOIN users u ON u.id = cp.owner_id
       WHERE cp.owner_id != ? AND cp.status = 'Open'
       ORDER BY cp.created_at DESC
       LIMIT 6`
    )
    .all(userId) as Array<{
    id: number;
    required_skills: string;
    category: string;
  }>;

  const userSkillNames = skills.map((s) => s.name.toLowerCase());
  const recommendedCollabs = openCollabs
    .map((c) => {
      const reqLower = c.required_skills.toLowerCase();
      const score = userSkillNames.reduce(
        (acc, sk) => (reqLower.includes(sk) ? acc + 1 : acc),
        0
      );
      return { ...c, match_score: score };
    })
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 3);

  const pendingIncomingRequests = (
    db
      .prepare(
        `SELECT COUNT(*) as c
         FROM collaboration_requests cr
         JOIN collaboration_projects cp ON cp.id = cr.collaboration_id
         WHERE cp.owner_id = ? AND cr.status = 'pending'`
      )
      .get(userId) as { c: number }
  ).c;

  res.json({
    user: req.user,
    profile,
    skills,
    learning: {
      total_completed_steps: totalCompleted,
      total_steps: totalSteps,
      overall_percent: totalSteps > 0 ? Math.round((totalCompleted / totalSteps) * 100) : 0,
      recent_roadmaps: recentRoadmaps,
    },
    projects,
    recent_posts: recentPosts,
    recommended_collaborations: recommendedCollabs,
    pending_incoming_requests: pendingIncomingRequests,
  });
});

// Public landing overview stats (real database counts)
app.get('/api/overview', (_req: Request, res: Response) => {
  const usersCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  const skillsCount = (db.prepare('SELECT COUNT(*) as c FROM skills').get() as { c: number }).c;
  const roadmapsCount = (
    db.prepare('SELECT COUNT(*) as c FROM learning_roadmaps').get() as { c: number }
  ).c;
  const projectsCount = (db.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number }).c;
  const collabsCount = (
    db.prepare('SELECT COUNT(*) as c FROM collaboration_projects').get() as { c: number }
  ).c;
  const roadmaps = db.prepare('SELECT id, title, category, difficulty, estimated_hours FROM learning_roadmaps LIMIT 4').all();

  res.json({
    counts: {
      members: usersCount,
      skills: skillsCount,
      roadmaps: roadmapsCount,
      projects: projectsCount,
      collaborations: collabsCount,
    },
    featured_roadmaps: roadmaps,
  });
});

// ---------- VITE / STATIC FRONTEND SERVING ----------

async function startServer(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillSphere server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
