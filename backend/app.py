
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
import os

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    # Database configuration: use DATABASE_URL in env (Postgres on Render), fallback to SQLite
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL') or 'sqlite:///meta.db'

    # JWT secret must be provided in production via env `JWT_SECRET`
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'dev-secret')

    # CORS: restrict origins in production via FRONTEND_URL env
    frontend_origin = os.getenv('FRONTEND_URL', '*')
    CORS(app, resources={r"/*": {"origins": frontend_origin}})
    db.init_app(app)
    jwt.init_app(app)

    from backend.routes.auth_routes import auth_bp
    from backend.routes.prompt_routes import prompt_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(prompt_bp)

    with app.app_context():
        db.create_all()

    return app

app = create_app()

if __name__ == '__main__':
    # For local development you can enable debug with FLASK_DEBUG=1
    debug_env = os.getenv('FLASK_DEBUG', '1')
    debug = debug_env in ('1', 'true', 'True')
    app.run(host='0.0.0.0', debug=debug)
