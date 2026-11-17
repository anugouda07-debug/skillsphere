from datetime import datetime, timezone
from flask import Blueprint, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash
from extensions import db, limiter
from auth_utils import create_access_token, login_required, optional_user
from models import (
    CollaborationProject,
    CollaborationRequest,
    Comment,
    LearningRoadmap,
    Post,
    Profile,
    Project,
    ProjectMember,
    RoadmapStep,
    Skill,
    User,
    UserLearningProgress,
    UserSkill,
)

api_bp = Blueprint("api", __name__, url_prefix="/api")

VALID_CATEGORIES = {"Student", "Graduate", "Professional", "Entrepreneur"}


def serialize_user(user: User):
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "category": user.category,
        "is_demo": user.is_demo,
        "created_at": user.created_at.isoformat(),
    }


def serialize_profile(profile: Profile | None):
    if not profile:
        return None
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "headline": profile.headline,
        "bio": profile.bio,
        "avatar_url": profile.avatar_url,
        "education_or_role": profile.education_or_role,
        "organization": profile.organization,
        "location": profile.location,
        "interests": profile.interests,
        "achievements": profile.achievements,
        "github_url": profile.github_url,
        "linkedin_url": profile.linkedin_url,
        "website_url": profile.website_url,
    }


@api_bp.post("/auth/register")
@limiter.limit("15 per 15 minutes")
def register():
    data = request.get_json(silent=True) or {}
    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    category = data.get("category") or ""
    headline = (data.get("headline") or "").strip()

    if len(full_name) < 2 or "@" not in email or len(password) < 8 or category not in VALID_CATEGORIES:
        return jsonify({"error": "Invalid registration fields provided."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists."}), 409

    user = User(
        full_name=full_name,
        email=email,
        password_hash=generate_password_hash(password),
        category=category,
        is_demo=False,
    )
    db.session.add(user)
    db.session.flush()
    profile = Profile(user_id=user.id, headline=headline or f"{category} on SkillSphere")
    db.session.add(profile)
    db.session.commit()

    token = create_access_token(user.id)
    resp = jsonify({"user": serialize_user(user), "token": token})
    resp.set_cookie("skillsphere_session", token, httponly=True, samesite="Lax", max_age=604800)
    return resp, 201


@api_bp.post("/auth/login")
@limiter.limit("25 per 15 minutes")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password."}), 401

    token = create_access_token(user.id)
    resp = jsonify({"user": serialize_user(user), "token": token})
    resp.set_cookie("skillsphere_session", token, httponly=True, samesite="Lax", max_age=604800)
    return resp


@api_bp.post("/auth/logout")
def logout():
    resp = jsonify({"message": "Logged out successfully."})
    resp.delete_cookie("skillsphere_session")
    return resp


@api_bp.get("/auth/me")
@login_required
def auth_me():
    return jsonify({"user": serialize_user(g.current_user), "profile": serialize_profile(g.current_user.profile)})


@api_bp.get("/profile/me")
@login_required
def get_my_profile():
    user = g.current_user
    skills = [
        {"id": us.id, "skill_id": us.skill_id, "name": us.skill.name, "category": us.skill.category, "proficiency_level": us.proficiency_level}
        for us in user.skills
    ]
    projects = [
        {"id": p.id, "user_id": p.user_id, "title": p.title, "summary": p.summary, "description": p.description, "technologies": p.technologies, "thumbnail_url": p.thumbnail_url, "github_url": p.github_url, "live_url": p.live_url}
        for p in user.projects
    ]
    return jsonify({"user": serialize_user(user), "profile": serialize_profile(user.profile), "skills": skills, "projects": projects})


@api_bp.put("/profile/me")
@login_required
def update_my_profile():
    user = g.current_user
    data = request.get_json(silent=True) or {}
    if data.get("full_name"):
        user.full_name = data["full_name"].strip()
    if data.get("category") in VALID_CATEGORIES:
        user.category = data["category"]
    profile = user.profile or Profile(user_id=user.id)
    for field in ["headline", "bio", "avatar_url", "education_or_role", "organization", "location", "interests", "achievements", "github_url", "linkedin_url", "website_url"]:
        if field in data:
            setattr(profile, field, (data[field] or "").strip())
    db.session.add(profile)
    db.session.commit()
    return jsonify({"user": serialize_user(user), "profile": serialize_profile(profile)})


@api_bp.get("/skills")
def list_skills():
    q = (request.args.get("q") or "").strip()
    category = (request.args.get("category") or "").strip()
    query = Skill.query
    if q:
        query = query.filter(Skill.name.ilike(f"%{q}%"))
    if category and category != "All":
        query = query.filter_by(category=category)
    skills = [{"id": s.id, "name": s.name, "category": s.category, "description": s.description} for s in query.order_by(Skill.name).all()]
    return jsonify({"skills": skills})


@api_bp.get("/user-skills")
@login_required
def get_user_skills():
    rows = [
        {"id": us.id, "skill_id": us.skill_id, "name": us.skill.name, "category": us.skill.category, "proficiency_level": us.proficiency_level}
        for us in g.current_user.skills
    ]
    return jsonify({"user_skills": rows})


@api_bp.post("/user-skills")
@login_required
def add_user_skill():
    data = request.get_json(silent=True) or {}
    skill_id = data.get("skill_id")
    level = data.get("proficiency_level", "Intermediate")
    if level not in {"Beginner", "Intermediate", "Advanced"}:
        level = "Intermediate"
    skill = Skill.query.get_or_404(skill_id)
    existing = UserSkill.query.filter_by(user_id=g.current_user.id, skill_id=skill.id).first()
    if existing:
        existing.proficiency_level = level
    else:
        existing = UserSkill(user_id=g.current_user.id, skill_id=skill.id, proficiency_level=level)
        db.session.add(existing)
    db.session.commit()
    return jsonify({"user_skill": {"id": existing.id, "skill_id": skill.id, "name": skill.name, "category": skill.category, "proficiency_level": existing.proficiency_level}}), 201


@api_bp.get("/roadmaps")
def list_roadmaps():
    user = optional_user()
    roadmaps = LearningRoadmap.query.order_by(LearningRoadmap.id).all()
    out = []
    for rm in roadmaps:
        total = len(rm.steps)
        completed = 0
        if user:
            step_ids = [s.id for s in rm.steps]
            if step_ids:
                completed = UserLearningProgress.query.filter(
                    UserLearningProgress.user_id == user.id,
                    UserLearningProgress.step_id.in_(step_ids),
                    UserLearningProgress.status == "completed",
                ).count()
        pct = round((completed / total) * 100) if total else 0
        out.append({"id": rm.id, "title": rm.title, "category": rm.category, "difficulty": rm.difficulty, "estimated_hours": rm.estimated_hours, "description": rm.description, "total_steps": total, "completed_steps": completed, "progress_percent": pct})
    return jsonify({"roadmaps": out})


@api_bp.get("/roadmaps/<int:roadmap_id>")
def roadmap_detail(roadmap_id: int):
    rm = LearningRoadmap.query.get_or_404(roadmap_id)
    user = optional_user()
    completed_ids = set()
    if user:
        rows = UserLearningProgress.query.filter_by(user_id=user.id, status="completed").all()
        completed_ids = {r.step_id for r in rows}
    steps = [
        {"id": s.id, "roadmap_id": s.roadmap_id, "step_order": s.step_order, "title": s.title, "description": s.description, "resource_title": s.resource_title, "resource_url": s.resource_url, "estimated_minutes": s.estimated_minutes, "status": "completed" if s.id in completed_ids else "pending"}
        for s in rm.steps
    ]
    total = len(steps)
    done = sum(1 for s in steps if s["status"] == "completed")
    return jsonify({"roadmap": {"id": rm.id, "title": rm.title, "category": rm.category, "difficulty": rm.difficulty, "estimated_hours": rm.estimated_hours, "description": rm.description}, "steps": steps, "total_steps": total, "completed_steps": done, "progress_percent": round((done / total) * 100) if total else 0})


@api_bp.post("/progress")
@login_required
def update_progress():
    data = request.get_json(silent=True) or {}
    step = RoadmapStep.query.get_or_404(data.get("step_id"))
    status = "pending" if data.get("status") == "pending" else "completed"
    prog = UserLearningProgress.query.filter_by(user_id=g.current_user.id, step_id=step.id).first()
    if not prog:
        prog = UserLearningProgress(user_id=g.current_user.id, step_id=step.id)
        db.session.add(prog)
    prog.status = status
    prog.completed_at = datetime.now(timezone.utc) if status == "completed" else None
    db.session.commit()
    return jsonify({"step_id": step.id, "status": status})


@api_bp.get("/projects")
@login_required
def list_projects():
    scope = request.args.get("scope", "mine")
    query = Project.query
    if scope != "all":
        query = query.filter_by(user_id=g.current_user.id)
    projects = [
        {"id": p.id, "user_id": p.user_id, "title": p.title, "summary": p.summary, "description": p.description, "technologies": p.technologies, "thumbnail_url": p.thumbnail_url, "github_url": p.github_url, "live_url": p.live_url, "owner_name": p.owner.full_name, "owner_category": p.owner.category}
        for p in query.order_by(Project.updated_at.desc()).all()
    ]
    return jsonify({"projects": projects})


@api_bp.post("/projects")
@login_required
def create_project():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    if len(title) < 3 or len(description) < 15:
        return jsonify({"error": "Title and detailed description are required."}), 400
    proj = Project(
        user_id=g.current_user.id,
        title=title,
        summary=(data.get("summary") or "").strip(),
        description=description,
        technologies=(data.get("technologies") or "").strip(),
        thumbnail_url=(data.get("thumbnail_url") or "").strip(),
        github_url=(data.get("github_url") or "").strip(),
        live_url=(data.get("live_url") or "").strip(),
    )
    db.session.add(proj)
    db.session.commit()
    return jsonify({"project": {"id": proj.id, "title": proj.title}}), 201


@api_bp.put("/projects/<int:project_id>")
@login_required
def update_project(project_id: int):
    proj = Project.query.get_or_404(project_id)
    if proj.user_id != g.current_user.id:
        return jsonify({"error": "Forbidden"}), 403
    data = request.get_json(silent=True) or {}
    for field in ["title", "summary", "description", "technologies", "thumbnail_url", "github_url", "live_url"]:
        if field in data:
            setattr(proj, field, (data[field] or "").strip())
    db.session.commit()
    return jsonify({"project": {"id": proj.id, "title": proj.title}})


@api_bp.delete("/projects/<int:project_id>")
@login_required
def delete_project(project_id: int):
    proj = Project.query.get_or_404(project_id)
    if proj.user_id != g.current_user.id:
        return jsonify({"error": "Forbidden"}), 403
    db.session.delete(proj)
    db.session.commit()
    return jsonify({"deleted": True})


@api_bp.get("/posts")
def list_posts():
    posts = Post.query.order_by(Post.last_activity_at.desc()).all()
    return jsonify({"posts": [{"id": p.id, "user_id": p.user_id, "post_type": p.post_type, "title": p.title, "content": p.content, "tags": p.tags, "author_name": p.author.full_name, "author_category": p.author.category, "comment_count": len(p.comments)} for p in posts]})


@api_bp.post("/posts")
@login_required
def create_post():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()
    if len(title) < 5 or len(content) < 20:
        return jsonify({"error": "Post title and content are required."}), 400
    post = Post(user_id=g.current_user.id, post_type=data.get("post_type", "Knowledge Share"), title=title, content=content, tags=(data.get("tags") or "").strip())
    db.session.add(post)
    db.session.commit()
    return jsonify({"post": {"id": post.id, "title": post.title}}), 201


@api_bp.post("/posts/<int:post_id>/comments")
@login_required
def add_comment(post_id: int):
    post = Post.query.get_or_404(post_id)
    content = ((request.get_json(silent=True) or {}).get("content") or "").strip()
    if len(content) < 3:
        return jsonify({"error": "Comment cannot be empty."}), 400
    comment = Comment(post_id=post.id, user_id=g.current_user.id, content=content)
    post.last_activity_at = datetime.now(timezone.utc)
    db.session.add(comment)
    db.session.commit()
    return jsonify({"comment": {"id": comment.id, "content": comment.content}}), 201


@api_bp.get("/collaborations")
def list_collaborations():
    collabs = CollaborationProject.query.order_by(CollaborationProject.created_at.desc()).all()
    return jsonify({"collaborations": [{"id": c.id, "owner_id": c.owner_id, "title": c.title, "description": c.description, "category": c.category, "required_skills": c.required_skills, "team_size": c.team_size, "status": c.status, "owner_name": c.owner.full_name, "member_count": len(c.members)} for c in collabs]})


@api_bp.post("/collaborations")
@login_required
def create_collaboration():
    data = request.get_json(silent=True) or {}
    collab = CollaborationProject(
        owner_id=g.current_user.id,
        title=(data.get("title") or "").strip(),
        description=(data.get("description") or "").strip(),
        category=(data.get("category") or "Web Development").strip(),
        required_skills=(data.get("required_skills") or "").strip(),
        team_size=int(data.get("team_size") or 4),
    )
    db.session.add(collab)
    db.session.flush()
    db.session.add(ProjectMember(collaboration_id=collab.id, user_id=g.current_user.id, role="Project Owner"))
    db.session.commit()
    return jsonify({"collaboration": {"id": collab.id, "title": collab.title}}), 201


@api_bp.post("/collaborations/<int:collab_id>/requests")
@login_required
def create_join_request(collab_id: int):
    collab = CollaborationProject.query.get_or_404(collab_id)
    if collab.owner_id == g.current_user.id:
        return jsonify({"error": "Owners cannot request to join their own project."}), 400
    if CollaborationRequest.query.filter_by(collaboration_id=collab.id, requester_id=g.current_user.id).first():
        return jsonify({"error": "Duplicate collaboration request prevented."}), 409
    message = ((request.get_json(silent=True) or {}).get("message") or "").strip()
    req_row = CollaborationRequest(collaboration_id=collab.id, requester_id=g.current_user.id, message=message)
    db.session.add(req_row)
    db.session.commit()
    return jsonify({"request": {"id": req_row.id, "status": req_row.status}}), 201


@api_bp.patch("/requests/<int:request_id>")
@login_required
def decide_request(request_id: int):
    req_row = CollaborationRequest.query.get_or_404(request_id)
    if req_row.collaboration.owner_id != g.current_user.id:
        return jsonify({"error": "Forbidden"}), 403
    status = (request.get_json(silent=True) or {}).get("status")
    if status not in {"accepted", "rejected"}:
        return jsonify({"error": "Invalid decision status."}), 400
    req_row.status = status
    if status == "accepted":
        exists = ProjectMember.query.filter_by(collaboration_id=req_row.collaboration_id, user_id=req_row.requester_id).first()
        if not exists:
            db.session.add(ProjectMember(collaboration_id=req_row.collaboration_id, user_id=req_row.requester_id, role="Collaborator"))
    db.session.commit()
    return jsonify({"request": {"id": req_row.id, "status": req_row.status}})
