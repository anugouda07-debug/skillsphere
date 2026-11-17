import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';

const SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(`skillsphere-dev-secret-${process.cwd()}`).digest('hex');

export const COOKIE_NAME = 'skillsphere_session';

export interface SafeUser {
  id: number;
  full_name: string;
  email: string;
  category: 'Student' | 'Graduate' | 'Professional' | 'Entrepreneur';
  is_demo: boolean;
  created_at: string;
}

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derived = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derived.length) return false;
  return crypto.timingSafeEqual(keyBuf, derived);
}

export function signToken(userId: number): string {
  const payload = {
    uid: userId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string): { uid: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expected = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      uid: number;
      exp: number;
    };
    if (!payload.uid || Date.now() > payload.exp) {
      return null;
    }
    return { uid: payload.uid };
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    out[key] = val;
  }
  return out;
}

export function extractTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[COOKIE_NAME] || null;
}

export function getSafeUserById(userId: number): SafeUser | null {
  const row = db
    .prepare(
      'SELECT id, full_name, email, category, is_demo, created_at FROM users WHERE id = ?'
    )
    .get(userId) as
    | {
        id: number;
        full_name: string;
        email: string;
        category: SafeUser['category'];
        is_demo: number;
        created_at: string;
      }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    category: row.category,
    is_demo: Boolean(row.is_demo),
    created_at: row.created_at,
  };
}

export function attachOptionalUser(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const token = extractTokenFromRequest(req);
  if (token) {
    const verified = verifyToken(token);
    if (verified) {
      const user = getSafeUserById(verified.uid);
      if (user) req.user = user;
    }
  }
  next();
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const verified = verifyToken(token);
  if (!verified) {
    res.status(401).json({ error: 'Invalid or expired session token' });
    return;
  }
  const user = getSafeUserById(verified.uid);
  if (!user) {
    res.status(401).json({ error: 'User account not found' });
    return;
  }
  req.user = user;
  next();
}

const rateBuckets = new Map<string, number[]>();

export function authRateLimit(maxAttempts = 25, windowMs = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const recent = (rateBuckets.get(key) || []).filter((ts) => now - ts < windowMs);
    if (recent.length >= maxAttempts) {
      res.status(429).json({
        error: 'Too many authentication attempts. Please wait a few minutes and try again.',
      });
      return;
    }
    recent.push(now);
    rateBuckets.set(key, recent);
    next();
  };
}
