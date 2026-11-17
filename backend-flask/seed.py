from werkzeug.security import generate_password_hash
from app import create_app
from extensions import db
from models import (
    CollaborationProject,
    CollaborationRequest,
    LearningRoadmap,
    Post,
    Profile,
    Project,
    ProjectMember,
    RoadmapStep,
    Skill,
    User,
    UserSkill,
)


def seed():
    app = create_app()
    with app.app_context():
        if User.query.first():
            print("Database already seeded.")
            return

        pw = generate_password_hash("DemoPass123!")
        aarav = User(full_name="Aarav Mehta", email="aarav.student@skillsphere.demo", password_hash=pw, category="Student", is_demo=True)
        elena = User(full_name="Elena Rostova", email="elena.grad@skillsphere.demo", password_hash=pw, category="Graduate", is_demo=True)
        marcus = User(full_name="Marcus Vance", email="marcus.pro@skillsphere.demo", password_hash=pw, category="Professional", is_demo=True)
        priya = User(full_name="Priya Nair", email="priya.founder@skillsphere.demo", password_hash=pw, category="Entrepreneur", is_demo=True)
        db.session.add_all([aarav, elena, marcus, priya])
        db.session.flush()

        db.session.add_all([
            Profile(user_id=aarav.id, headline="CS Undergraduate exploring Full-Stack & Applied AI", organization="NIT", location="Bengaluru"),
            Profile(user_id=elena.id, headline="Data Science Graduate building forecasting tools", organization="TU Munich", location="Munich"),
            Profile(user_id=marcus.id, headline="Staff Engineer & Mentor", organization="Northstar Cloud", location="Toronto"),
            Profile(user_id=priya.id, headline="Founder at CivicLearn", organization="CivicLearn Labs", location="Singapore"),
        ])

        py = Skill(name="Python", category="Programming", description="Backend APIs, automation, and AI.")
        react = Skill(name="React.js", category="Web Development", description="Component-driven UI engineering.")
        db.session.add_all([py, react])
        db.session.flush()
        db.session.add(UserSkill(user_id=aarav.id, skill_id=react.id, proficiency_level="Intermediate"))

        rm = LearningRoadmap(title="Full-Stack Web Engineering", category="Web Development", difficulty="Intermediate", estimated_hours=36, description="End-to-end React + Flask + MySQL mastery.")
        db.session.add(rm)
        db.session.flush()
        db.session.add(RoadmapStep(roadmap_id=rm.id, step_order=1, title="Relational Schema Design", description="Normalize tables with foreign keys and indexes.", estimated_minutes=60))

        db.session.add(Project(user_id=aarav.id, title="PulseGrid Planner", summary="Adaptive syllabus tracker", description="Tracks weekly milestones.", technologies="React, Flask, MySQL"))
        db.session.add(Post(user_id=marcus.id, post_type="Knowledge Share", title="Idempotent Collaboration Workflows", content="Always enforce composite unique constraints on join requests."))

        collab = CollaborationProject(owner_id=priya.id, title="OpenMentor Scheduler", description="Peer code review office hours platform.", category="Web Development", required_skills="React.js, Python, Flask", team_size=5)
        db.session.add(collab)
        db.session.flush()
        db.session.add(ProjectMember(collaboration_id=collab.id, user_id=priya.id, role="Project Owner"))
        db.session.add(CollaborationRequest(collaboration_id=collab.id, requester_id=aarav.id, message="Excited to contribute React UI views."))

        db.session.commit()
        print("Seeded SkillSphere MySQL database.")


if __name__ == "__main__":
    seed()
