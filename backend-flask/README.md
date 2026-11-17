# SkillSphere Python Flask + MySQL Backend

This directory contains the production-ready **Python Flask + Flask-SQLAlchemy + Flask-Migrate + MySQL** backend matching the SkillSphere relational database design and REST API specification.

> Note on the live AI Studio preview: Because the AI Studio preview sandbox runs Node.js on port 3000 without a local MySQL daemon, the live preview serves the identical 12+ table relational schema and REST API contract via `server.ts` + SQLite so all interactive features work immediately in the preview. When deploying externally with MySQL, run this Flask backend and point the Vite proxy or `VITE_API_BASE_URL` to port `5000`.

## Setup Instructions

1. Create and activate a virtual environment:
   ```bash
   cd backend-flask
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Create the MySQL database and configure `.env`:
   ```bash
   mysql -u root -p < schema.sql
   cp .env.example .env
   ```
   Update `DATABASE_URL` in `.env` with your MySQL credentials:
   `DATABASE_URL=mysql+pymysql://root:password@localhost:3306/skillsphere`

3. Run Flask-Migrate & seed initial demonstration records:
   ```bash
   flask --app app db init
   flask --app app db migrate -m "Initial SkillSphere schema"
   flask --app app db upgrade
   python seed.py
   ```

4. Start the Flask API server:
   ```bash
   flask --app app run --host=0.0.0.0 --port=5000
   ```
