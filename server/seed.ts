import { db } from './db.ts';
import { hashPassword } from './auth.ts';

export function seedDatabaseIfEmpty(): void {
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (userCount > 0) return;

  const demoPasswordHash = hashPassword('DemoPass123!');

  const insertUser = db.prepare(`
    INSERT INTO users (full_name, email, password_hash, category, is_demo)
    VALUES (?, ?, ?, ?, 1)
  `);

  const insertProfile = db.prepare(`
    INSERT INTO profiles (
      user_id, headline, bio, avatar_url, education_or_role, organization,
      location, interests, achievements, github_url, linkedin_url, website_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    const aarav = Number(
      insertUser.run('Aarav Mehta', 'aarav.student@skillsphere.demo', demoPasswordHash, 'Student')
        .lastInsertRowid
    );
    const elena = Number(
      insertUser.run('Elena Rostova', 'elena.grad@skillsphere.demo', demoPasswordHash, 'Graduate')
        .lastInsertRowid
    );
    const marcus = Number(
      insertUser.run(
        'Marcus Vance',
        'marcus.pro@skillsphere.demo',
        demoPasswordHash,
        'Professional'
      ).lastInsertRowid
    );
    const priya = Number(
      insertUser.run(
        'Priya Nair',
        'priya.founder@skillsphere.demo',
        demoPasswordHash,
        'Entrepreneur'
      ).lastInsertRowid
    );

    insertProfile.run(
      aarav,
      'Computer Science Undergraduate exploring Full-Stack Systems & Applied AI',
      'Final-year CS student focused on distributed backend architectures, React interfaces, and practical machine learning pipelines. Looking for peer study groups and open-source product builds.',
      '/src/assets/images/avatar_mentor_portrait_1794909898492.jpg',
      'B.Tech Computer Science (2027)',
      'National Institute of Technology',
      'Bengaluru, India',
      'Web Development, Machine Learning, System Design, Open Source',
      'Top 10 Finalist at National Smart Campus Hackathon 2025 · Published campus transit API',
      'https://github.com/skillsphere-demo/aarav',
      'https://linkedin.com/in/skillsphere-demo-aarav',
      ''
    );

    insertProfile.run(
      elena,
      'Data Science Graduate building reproducible analytics & forecasting tools',
      'Recent M.Sc. Data Science graduate transitioning research models into production web tools. Passionate about clean SQL modeling, Python data engineering, and accessible data storytelling.',
      '',
      'M.Sc. Applied Data Science (2026)',
      'TU Munich',
      'Munich, Germany',
      'Data Science, Python, SQL, Product Analytics',
      'Published thesis on urban energy demand forecasting · Google Summer of Code Contributor',
      'https://github.com/skillsphere-demo/elena',
      'https://linkedin.com/in/skillsphere-demo-elena',
      'https://elena-analytics.example.com'
    );

    insertProfile.run(
      marcus,
      'Senior Backend Architect & Mentor · Python, Cloud & Distributed APIs',
      'Eight years designing high-throughput financial and EdTech platforms. Active on SkillSphere to share system architecture patterns, mentor early-career engineers, and co-build civic tech.',
      '/src/assets/images/avatar_mentor_portrait_1794909898492.jpg',
      'Staff Software Engineer',
      'Northstar Cloud Systems',
      'Toronto, Canada',
      'Programming, Artificial Intelligence, System Architecture, Mentorship',
      'Architected multi-region API gateway serving 12M daily requests · Speaker at PyCon',
      'https://github.com/skillsphere-demo/marcus',
      'https://linkedin.com/in/skillsphere-demo-marcus',
      ''
    );

    insertProfile.run(
      priya,
      'Founder at CivicLearn · Connecting emerging talent with real product challenges',
      'Product entrepreneur building micro-internship and verifiable skill infrastructure. Seeking technical co-builders, UI designers, and data engineers for early-stage pilots.',
      '',
      'Founder & Product Lead',
      'CivicLearn Labs',
      'Singapore',
      'Entrepreneurship, Business, Design, Product Strategy',
      'Scaled B2B pilot across 14 universities · Seed accelerator alumna',
      '',
      'https://linkedin.com/in/skillsphere-demo-priya',
      'https://civiclearn.example.com'
    );

    // Skills Catalog
    const skillRows: Array<[string, string, string]> = [
      ['Python', 'Programming', 'General-purpose language for backend APIs, automation, and AI.'],
      ['TypeScript', 'Programming', 'Typed JavaScript for scalable frontend and backend codebases.'],
      ['SQL & Relational Modeling', 'Programming', 'Schema design, indexing, joins, and query tuning.'],
      ['React.js', 'Web Development', 'Component-driven UI engineering and state architecture.'],
      ['Flask REST APIs', 'Web Development', 'Lightweight Python web framework for structured APIs.'],
      ['Tailwind CSS', 'Design', 'Utility-first design system implementation and responsive layouts.'],
      ['UI/UX Architecture', 'Design', 'Information hierarchy, accessible flows, and interaction design.'],
      ['Machine Learning Foundations', 'Machine Learning', 'Supervised/unsupervised learning, evaluation, and feature engineering.'],
      ['Applied LLM Engineering', 'Artificial Intelligence', 'Prompt engineering, RAG pipelines, and tool integration.'],
      ['Data Visualization', 'Data Science', 'Exploratory analysis and executive visual storytelling.'],
      ['Pandas & NumPy', 'Data Science', 'Vectorized data cleaning, transformation, and statistics.'],
      ['Product Strategy', 'Business', 'Problem discovery, roadmapping, and outcome metrics.'],
      ['Startup Validation', 'Entrepreneurship', 'Customer interviews, MVP scoping, and go-to-market design.'],
      ['Technical Communication', 'Communication', 'Writing RFCs, documentation, and engineering demos.'],
    ];

    const insertSkill = db.prepare(
      'INSERT INTO skills (name, category, description) VALUES (?, ?, ?)'
    );
    const skillIds: Record<string, number> = {};
    for (const [name, category, desc] of skillRows) {
      skillIds[name] = Number(insertSkill.run(name, category, desc).lastInsertRowid);
    }

    const insertUserSkill = db.prepare(
      'INSERT INTO user_skills (user_id, skill_id, proficiency_level) VALUES (?, ?, ?)'
    );
    insertUserSkill.run(aarav, skillIds['React.js'], 'Intermediate');
    insertUserSkill.run(aarav, skillIds['Python'], 'Intermediate');
    insertUserSkill.run(aarav, skillIds['SQL & Relational Modeling'], 'Beginner');
    insertUserSkill.run(aarav, skillIds['Tailwind CSS'], 'Intermediate');

    insertUserSkill.run(elena, skillIds['Python'], 'Advanced');
    insertUserSkill.run(elena, skillIds['Pandas & NumPy'], 'Advanced');
    insertUserSkill.run(elena, skillIds['Data Visualization'], 'Intermediate');
    insertUserSkill.run(elena, skillIds['Machine Learning Foundations'], 'Intermediate');

    insertUserSkill.run(marcus, skillIds['Python'], 'Advanced');
    insertUserSkill.run(marcus, skillIds['Flask REST APIs'], 'Advanced');
    insertUserSkill.run(marcus, skillIds['SQL & Relational Modeling'], 'Advanced');
    insertUserSkill.run(marcus, skillIds['Technical Communication'], 'Advanced');

    insertUserSkill.run(priya, skillIds['Product Strategy'], 'Advanced');
    insertUserSkill.run(priya, skillIds['Startup Validation'], 'Advanced');
    insertUserSkill.run(priya, skillIds['UI/UX Architecture'], 'Intermediate');

    // Learning Roadmaps & Steps
    const insertRoadmap = db.prepare(`
      INSERT INTO learning_roadmaps (title, category, difficulty, estimated_hours, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertStep = db.prepare(`
      INSERT INTO roadmap_steps (roadmap_id, step_order, title, description, resource_title, resource_url, estimated_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const rm1 = Number(
      insertRoadmap.run(
        'Full-Stack Web Engineering with React & REST APIs',
        'Web Development',
        'Intermediate',
        36,
        'Master component architecture, client-side routing, relational SQL schemas, and authenticated REST endpoints from scratch.'
      ).lastInsertRowid
    );
    const rm1Steps = [
      [1, 'Semantic HTML & Accessible Layout Systems', 'Build responsive grid structures, form labels, and keyboard-navigable interfaces.', 'MDN Web Accessibility Guide', 'https://developer.mozilla.org/en-US/docs/Learn/Accessibility', 60],
      [2, 'React Component Composition & Routing', 'Structure reusable views, protected routes, and shared auth state with React Router.', 'React Official Documentation', 'https://react.dev/learn', 90],
      [3, 'Relational Database Modeling & Indexing', 'Design normalized tables, foreign keys, unique constraints, and performant indexes.', 'Use The Index, Luke', 'https://use-the-index-luke.com/', 75],
      [4, 'REST API Validation, Auth & Ownership Checks', 'Implement secure password hashing, session tokens, rate limiting, and resource authorization.', 'OWASP API Security Top 10', 'https://owasp.org/API-Security/', 90],
      [5, 'End-to-End Integration & Portfolio Deployment', 'Connect frontend state to live API responses with error handling and production build checks.', 'Vite Production Guide', 'https://vite.dev/guide/build.html', 60],
    ] as const;
    const rm1StepIds: number[] = [];
    for (const s of rm1Steps) {
      rm1StepIds.push(Number(insertStep.run(rm1, s[0], s[1], s[2], s[3], s[4], s[5]).lastInsertRowid));
    }

    const rm2 = Number(
      insertRoadmap.run(
        'Applied Data Science & Machine Learning Pipeline',
        'Data Science',
        'Intermediate',
        42,
        'Progress from exploratory data cleaning and statistical visualization to reproducible machine learning model evaluation.'
      ).lastInsertRowid
    );
    const rm2Steps = [
      [1, 'Data Wrangling with Pandas & SQL', 'Clean missing fields, normalize schemas, and aggregate multi-table datasets.', 'Pandas User Guide', 'https://pandas.pydata.org/docs/user_guide/index.html', 80],
      [2, 'Exploratory Visualization & Outlier Analysis', 'Create clear comparative distributions and time-series diagnostics.', 'Seaborn Tutorial', 'https://seaborn.pydata.org/tutorial.html', 65],
      [3, 'Feature Engineering & Cross-Validation', 'Prevent data leakage with stratified splits and scikit-learn pipelines.', 'Scikit-Learn Cross Validation', 'https://scikit-learn.org/stable/modules/cross_validation.html', 90],
      [4, 'Model Calibration & Error Analysis', 'Evaluate precision-recall tradeoffs and publish reproducible notebooks.', 'Google ML Crash Course', 'https://developers.google.com/machine-learning/crash-course', 75],
    ] as const;
    const rm2StepIds: number[] = [];
    for (const s of rm2Steps) {
      rm2StepIds.push(Number(insertStep.run(rm2, s[0], s[1], s[2], s[3], s[4], s[5]).lastInsertRowid));
    }

    const rm3 = Number(
      insertRoadmap.run(
        'Practical Artificial Intelligence Engineering',
        'Artificial Intelligence',
        'Advanced',
        30,
        'Design grounded AI workflows, structured outputs, retrieval pipelines, and latency-aware evaluation harnesses.'
      ).lastInsertRowid
    );
    const rm3Steps = [
      [1, 'Structured Prompts & Schema Validation', 'Enforce deterministic JSON outputs and guardrails for production tasks.', 'Prompt Engineering Guide', 'https://www.promptingguide.ai/', 55],
      [2, 'Embeddings & Retrieval-Augmented Generation', 'Chunk domain documents, index vectors, and verify source citations.', 'Information Retrieval Basics', 'https://nlp.stanford.edu/IR-book/', 90],
      [3, 'Evaluation Harnesses & Latency Budgets', 'Measure regression accuracy and cost per request across test suites.', 'Eval Driven Development', 'https://eugeneyan.com/writing/llm-evaluators/', 75],
    ] as const;
    for (const s of rm3Steps) {
      insertStep.run(rm3, s[0], s[1], s[2], s[3], s[4], s[5]);
    }

    const rm4 = Number(
      insertRoadmap.run(
        'Zero-to-One Product & Venture Launch',
        'Entrepreneurship',
        'Beginner',
        24,
        'Validate real user pain points, scope lean MVPs, run structured discovery interviews, and assemble cross-functional teams.'
      ).lastInsertRowid
    );
    const rm4Steps = [
      [1, 'Problem Discovery & User Interviews', 'Conduct unbiased discovery conversations focused on past workflows rather than hypotheticals.', 'The Mom Test Summary', 'https://www.momtestbook.com/', 50],
      [2, 'Minimum Viable Product Scoping', 'Define the single core loop that proves user value within two weeks.', 'Y Combinator Startup Library', 'https://www.ycombinator.com/library', 60],
      [3, 'Technical Co-Builder Alignment & Pitching', 'Write a concise product brief, milestone plan, and equity/contribution expectations.', 'Startup School Curriculum', 'https://www.startupschool.org/', 60],
    ] as const;
    for (const s of rm4Steps) {
      insertStep.run(rm4, s[0], s[1], s[2], s[3], s[4], s[5]);
    }

    const rm5 = Number(
      insertRoadmap.run(
        'Design Systems & Product UI Architecture',
        'Design',
        'Beginner',
        22,
        'Establish typographic hierarchy, accessible color contrast, tabular metrics, and responsive grid discipline.'
      ).lastInsertRowid
    );
    const rm5Steps = [
      [1, 'Typographic Scale & Visual Hierarchy', 'Pair display and body typefaces with clear line-height and measure limits.', 'Practical Typography', 'https://practicaltypography.com/', 55],
      [2, 'WCAG Contrast & Accessible Controls', 'Verify 4.5:1 text contrast, keyboard focus rings, and semantic landmarks.', 'W3C WAI Guidelines', 'https://www.w3.org/WAI/standards-guidelines/wcag/', 65],
      [3, 'Component Tokens & Responsive Grids', 'Translate design tokens cleanly into CSS grid and Tailwind utilities.', 'Tailwind CSS Docs', 'https://tailwindcss.com/docs', 60],
    ] as const;
    for (const s of rm5Steps) {
      insertStep.run(rm5, s[0], s[1], s[2], s[3], s[4], s[5]);
    }

    // Seed learning progress for Aarav & Elena
    const insertProg = db.prepare(`
      INSERT INTO user_learning_progress (user_id, step_id, status, completed_at)
      VALUES (?, ?, 'completed', datetime('now'))
    `);
    insertProg.run(aarav, rm1StepIds[0]);
    insertProg.run(aarav, rm1StepIds[1]);
    insertProg.run(aarav, rm1StepIds[2]);
    insertProg.run(aarav, rm2StepIds[0]);

    insertProg.run(elena, rm2StepIds[0]);
    insertProg.run(elena, rm2StepIds[1]);
    insertProg.run(elena, rm2StepIds[2]);

    db.prepare('INSERT INTO roadmap_views (user_id, roadmap_id) VALUES (?, ?)').run(aarav, rm1);
    db.prepare('INSERT INTO roadmap_views (user_id, roadmap_id) VALUES (?, ?)').run(aarav, rm2);
    db.prepare('INSERT INTO roadmap_views (user_id, roadmap_id) VALUES (?, ?)').run(elena, rm2);

    // Portfolio Projects
    const insertProject = db.prepare(`
      INSERT INTO projects (user_id, title, summary, description, technologies, thumbnail_url, github_url, live_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertProject.run(
      aarav,
      'PulseGrid — Adaptive Study & Milestone Planner',
      'Full-stack syllabus tracker that turns course modules into weekly study blocks with progress telemetry.',
      'Built to help engineering undergraduates balance lab deadlines and self-paced certifications. Features relational milestone tracking, deadline alerts, and a keyboard-first calendar view.',
      'React, TypeScript, Flask, MySQL, Tailwind CSS',
      '/src/assets/images/project_ai_study_planner_1794909897619.jpg',
      'https://github.com/skillsphere-demo/pulsegrid-planner',
      'https://pulsegrid-demo.example.com'
    );

    insertProject.run(
      elena,
      'UrbanWatt — City Energy Forecasting Dashboard',
      'Time-series forecasting workbench comparing regional grid loads across seasonal weather shifts.',
      'Developed as part of applied research at TU Munich. Ingests hourly municipal energy telemetry, cleans sensor gaps with Pandas, and renders 48-hour confidence intervals.',
      'Python, Pandas, Scikit-Learn, React, SQL',
      '/src/assets/images/project_fintech_ledger_1794909898484.jpg',
      'https://github.com/skillsphere-demo/urbanwatt-forecast',
      'https://urbanwatt-demo.example.com'
    );

    insertProject.run(
      marcus,
      'RelayGate — Multi-Tenant Webhook & API Auditor',
      'Zero-dependency signature verification and replay queue for B2B SaaS integrations.',
      'Designed to eliminate silent webhook drops during downstream outages. Uses exponential backoff queues, idempotency keys, and an audit table for engineering support teams.',
      'Python, Flask, SQLAlchemy, PostgreSQL, Docker',
      '/src/assets/images/project_fintech_ledger_1794909898484.jpg',
      'https://github.com/skillsphere-demo/relaygate',
      ''
    );

    insertProject.run(
      priya,
      'CivicLearn Cohort Portal',
      'Micro-internship matching portal connecting university teams with social-impact startups.',
      'Structured brief templates, mentor check-in logs, and verifiable deliverable archives for 14 partner campuses.',
      'React, Python, MySQL, Figma',
      '/src/assets/images/project_ai_study_planner_1794909897619.jpg',
      '',
      'https://civiclearn-portal.example.com'
    );

    // Community Posts & Comments
    const insertPost = db.prepare(`
      INSERT INTO posts (user_id, post_type, title, content, tags, last_activity_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', ?))
    `);
    const insertComment = db.prepare(`
      INSERT INTO comments (post_id, user_id, content)
      VALUES (?, ?, ?)
    `);

    const p1 = Number(
      insertPost.run(
        marcus,
        'Knowledge Share',
        'Designing idempotent REST endpoints when building collaboration workflows',
        'When two users trigger a join request or approval simultaneously, naive INSERTs either crash or create duplicate team rows. Always enforce a composite UNIQUE constraint at the database layer (e.g. UNIQUE(collaboration_id, requester_id)) and wrap state transitions like accepting a request + inserting a project member inside a single database transaction.',
        'Backend, SQL, Architecture, Flask',
        '-2 hours'
      ).lastInsertRowid
    );
    insertComment.run(
      p1,
      aarav,
      'This solved a race condition I hit in my hackathon backend last month. Wrapping the member insert inside the same transaction made it rock solid.'
    );
    insertComment.run(
      p1,
      elena,
      'Great tip. Do you also return 409 Conflict when a duplicate request hits the unique constraint?'
    );

    const p2 = Number(
      insertPost.run(
        aarav,
        'Question',
        'How should graduates structure portfolio case studies for backend-heavy projects?',
        'Frontend projects have obvious screenshots, whereas API gateways or data pipelines are harder to showcase cleanly. What elements do hiring engineers actually look for in a portfolio writeup?',
        'Portfolio, Career, Graduates, Engineering',
        '-5 hours'
      ).lastInsertRowid
    );
    insertComment.run(
      p2,
      marcus,
      'Lead with the problem constraint, show an architecture diagram or schema snippet, include real latency or throughput benchmarks you measured, and link directly to clean README setup instructions.'
    );

    const p3 = Number(
      insertPost.run(
        elena,
        'Learning Experience',
        'What I learned migrating exploratory Jupyter notebooks into a typed API service',
        'For months my forecasting model lived inside a 900-line notebook. Extracting preprocessing into pure functions, writing unit tests for edge cases like missing timestamps, and exposing a clean JSON schema revealed three subtle leakage bugs immediately.',
        'Data Science, Python, Engineering',
        '-1 day'
      ).lastInsertRowid
    );
    insertComment.run(
      p3,
      priya,
      'Would love to see a short template for how you structured your preprocessing module!'
    );

    // Collaboration Projects, Requests & Members
    const insertCollab = db.prepare(`
      INSERT INTO collaboration_projects (owner_id, title, description, category, required_skills, team_size, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMember = db.prepare(`
      INSERT INTO project_members (collaboration_id, user_id, role)
      VALUES (?, ?, ?)
    `);
    const insertRequest = db.prepare(`
      INSERT INTO collaboration_requests (collaboration_id, requester_id, message, status)
      VALUES (?, ?, ?, ?)
    `);

    const c1 = Number(
      insertCollab.run(
        priya,
        'OpenMentor — Peer Code Review & Office Hours Matcher',
        'Building a lightweight scheduling and rubric feedback tool so senior engineers can host 30-minute portfolio review sessions for students and recent graduates across timezones.',
        'Web Development',
        'React.js, Python, Flask REST APIs, UI/UX Architecture',
        5,
        'Open'
      ).lastInsertRowid
    );
    insertMember.run(c1, priya, 'Project Owner');
    insertMember.run(c1, marcus, 'Backend Advisor');
    insertRequest.run(
      c1,
      aarav,
      'I built a similar scheduling component for PulseGrid and would love to own the React calendar and slot booking views.',
      'pending'
    );

    const c2 = Number(
      insertCollab.run(
        elena,
        'ClimateGrid Open Telemetry Explorer',
        'Open-source interactive dashboard visualizing regional renewable energy mix and grid demand anomalies using public European & Asian datasets.',
        'Data Science',
        'Python, Pandas & NumPy, Data Visualization, TypeScript',
        4,
        'Open'
      ).lastInsertRowid
    );
    insertMember.run(c2, elena, 'Project Owner');
    insertRequest.run(
      c2,
      marcus,
      'Happy to help containerize the ingestion pipeline and optimize the SQL time-bucket queries.',
      'pending'
    );

    const c3 = Number(
      insertCollab.run(
        aarav,
        'CampusTransit Live — Accessible Route & Shuttle Tracker',
        'Student-led initiative creating real-time shuttle arrival estimates and low-bandwidth schedules for university campuses.',
        'Programming',
        'TypeScript, React.js, SQL & Relational Modeling',
        4,
        'In Progress'
      ).lastInsertRowid
    );
    insertMember.run(c3, aarav, 'Project Owner');
    insertMember.run(c3, elena, 'Data Analyst');
  });

  tx();
}
