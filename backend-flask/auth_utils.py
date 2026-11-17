from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import current_app, g, request, jsonify
import jwt
from models import User


def create_access_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def decode_token(token: str):
    return jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])


def extract_token() -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    return request.cookies.get("skillsphere_session")


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = extract_token()
        if not token:
            return jsonify({"error": "Authentication required"}), 401
        try:
            payload = decode_token(token)
            user = User.query.get(int(payload["sub"]))
            if not user:
                return jsonify({"error": "User not found"}), 401
            g.current_user = user
        except Exception:
            return jsonify({"error": "Invalid or expired token"}), 401
        return fn(*args, **kwargs)

    return wrapper


def optional_user():
    token = extract_token()
    if not token:
        return None
    try:
        payload = decode_token(token)
        return User.query.get(int(payload["sub"]))
    except Exception:
        return None
