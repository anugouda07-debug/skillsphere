from datetime import datetime, timezone
from extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.BigInteger, primary_key=True)
    full_name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    category = db.Column(
        db.Enum("Student", "Graduate", "Professional", "Entrepreneur", name="user_category"),
        nullable=False,
    )
    is_demo = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    profile = db.relationship("Profile", backref="user", uselist=False, cascade="all, delete-orphan")
    skills = db.relationship("UserSkill", backref="user", cascade="all, delete-orphan")
    projects = db.relationship("Project", backref="owner", cascade="all, delete-orphan")
    posts = db.relationship("Post", backref="author", cascade="all, delete-orphan")


class Profile(db.Model):
    __tablename__ = "profiles"

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    headline = db.Column(db.String(180), nullable=False, default="")
    bio = db.Column(db.Text, nullable=False, default="")
    avatar_url = db.Column(db.String(500), nullable=False, default="")
    education_or_role = db.Column(db.String(140), nullable=False, default="")
    organization = db.Column(db.String(140), nullable=False, default="")
    location = db.Column(db.String(100), nullable=False, default="")
    interests = db.Column(db.String(300), nullable=False, default="")
    achievements = db.Column(db.Text, nullable=False, default="")
    github_url = db.Column(db.String(500), nullable=False, default="")
    linkedin_url = db.Column(db.String(500), nullable=False, default="")
    website_url = db.Column(db.String(500), nullable=False, default="")
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)


class Skill(db.Model):
    __tablename__ = "skills"

    id = db.Column(db.BigInteger, primary_key=True)
    name = db.Column(db.String(80), nullable=False, unique=True)
    category = db.Column(db.String(80), nullable=False, index=True)
    description = db.Column(db.String(255), nullable=False, default="")
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)


class UserSkill(db.Model):
    __tablename__ = "user_skills"
    __table_args__ = (db.UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),)

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_id = db.Column(db.BigInteger, db.ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    proficiency_level = db.Column(
        db.Enum("Beginner", "Intermediate", "Advanced", name="proficiency_level"),
        nullable=False,
        default="Intermediate",
    )
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    skill = db.relationship("Skill")


class LearningRoadmap(db.Model):
    __tablename__ = "learning_roadmaps"

    id = db.Column(db.BigInteger, primary_key=True)
    title = db.Column(db.String(180), nullable=False)
    category = db.Column(db.String(80), nullable=False, index=True)
    difficulty = db.Column(
        db.Enum("Beginner", "Intermediate", "Advanced", name="roadmap_difficulty"),
        nullable=False,
    )
    estimated_hours = db.Column(db.Integer, nullable=False, default=20)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    steps = db.relationship(
        "RoadmapStep",
        backref="roadmap",
        order_by="RoadmapStep.step_order",
        cascade="all, delete-orphan",
    )


class RoadmapStep(db.Model):
    __tablename__ = "roadmap_steps"

    id = db.Column(db.BigInteger, primary_key=True)
    roadmap_id = db.Column(
        db.BigInteger, db.ForeignKey("learning_roadmaps.id", ondelete="CASCADE"), nullable=False, index=True
    )
    step_order = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text, nullable=False)
    resource_title = db.Column(db.String(140), nullable=False, default="")
    resource_url = db.Column(db.String(500), nullable=False, default="")
    estimated_minutes = db.Column(db.Integer, nullable=False, default=45)
    added_by_user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class UserLearningProgress(db.Model):
    __tablename__ = "user_learning_progress"
    __table_args__ = (db.UniqueConstraint("user_id", "step_id", name="uq_user_step_progress"),)

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    step_id = db.Column(db.BigInteger, db.ForeignKey("roadmap_steps.id", ondelete="CASCADE"), nullable=False)
    status = db.Column(db.Enum("pending", "completed", name="progress_status"), nullable=False, default="pending")
    completed_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(140), nullable=False)
    summary = db.Column(db.String(240), nullable=False, default="")
    description = db.Column(db.Text, nullable=False)
    technologies = db.Column(db.String(255), nullable=False, default="")
    thumbnail_url = db.Column(db.String(500), nullable=False, default="")
    github_url = db.Column(db.String(500), nullable=False, default="")
    live_url = db.Column(db.String(500), nullable=False, default="")
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)


class Post(db.Model):
    __tablename__ = "posts"

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_type = db.Column(
        db.Enum("Question", "Knowledge Share", "Learning Experience", name="post_type"),
        nullable=False,
        default="Knowledge Share",
    )
    title = db.Column(db.String(180), nullable=False)
    content = db.Column(db.Text, nullable=False)
    tags = db.Column(db.String(220), nullable=False, default="")
    last_activity_at = db.Column(db.DateTime, nullable=False, default=utcnow, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)
    comments = db.relationship("Comment", backref="post", cascade="all, delete-orphan")


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.BigInteger, primary_key=True)
    post_id = db.Column(db.BigInteger, db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    author = db.relationship("User")


class CollaborationProject(db.Model):
    __tablename__ = "collaboration_projects"

    id = db.Column(db.BigInteger, primary_key=True)
    owner_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(80), nullable=False)
    required_skills = db.Column(db.String(320), nullable=False)
    team_size = db.Column(db.Integer, nullable=False, default=4)
    status = db.Column(
        db.Enum("Open", "In Progress", "Completed", name="collab_status"),
        nullable=False,
        default="Open",
        index=True,
    )
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)
    owner = db.relationship("User")
    members = db.relationship("ProjectMember", backref="collaboration", cascade="all, delete-orphan")
    requests = db.relationship("CollaborationRequest", backref="collaboration", cascade="all, delete-orphan")


class CollaborationRequest(db.Model):
    __tablename__ = "collaboration_requests"
    __table_args__ = (db.UniqueConstraint("collaboration_id", "requester_id", name="uq_collab_requester"),)

    id = db.Column(db.BigInteger, primary_key=True)
    collaboration_id = db.Column(
        db.BigInteger, db.ForeignKey("collaboration_projects.id", ondelete="CASCADE"), nullable=False
    )
    requester_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = db.Column(db.Text, nullable=False, default="")
    status = db.Column(
        db.Enum("pending", "accepted", "rejected", name="request_status"),
        nullable=False,
        default="pending",
    )
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)
    requester = db.relationship("User")


class ProjectMember(db.Model):
    __tablename__ = "project_members"
    __table_args__ = (db.UniqueConstraint("collaboration_id", "user_id", name="uq_project_member"),)

    id = db.Column(db.BigInteger, primary_key=True)
    collaboration_id = db.Column(
        db.BigInteger, db.ForeignKey("collaboration_projects.id", ondelete="CASCADE"), nullable=False
    )
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = db.Column(db.String(80), nullable=False, default="Collaborator")
    joined_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    user = db.relationship("User")
