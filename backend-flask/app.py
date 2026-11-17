from flask import Flask
from config import Config
from extensions import cors, db, limiter, migrate
from routes.api import api_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)
    limiter.init_app(app)

    app.register_blueprint(api_bp)

    @app.get("/api/health")
    def health():
        return {"status": "ok", "service": "SkillSphere Flask API"}

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
