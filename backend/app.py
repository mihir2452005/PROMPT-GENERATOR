from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv
from backend.extensions import db

# Load environment variables from .env files in root or backend directories
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
load_dotenv(os.path.join(parent_dir, '.env'))
load_dotenv(os.path.join(current_dir, '.env'))
load_dotenv()

jwt = JWTManager()


def create_app():
    app = Flask(__name__)
    # Database configuration: use DATABASE_URL in env (Postgres on Render), fallback to SQLite
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL') or 'sqlite:///meta.db'

    # JWT secret must be provided in production via env `JWT_SECRET`
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'dev-secret')

    # CORS: allow all origins and headers for API access
    CORS(app, origins="*", allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    db.init_app(app)
    jwt.init_app(app)

    from backend.routes.auth_routes import auth_bp
    from backend.routes.prompt_routes import prompt_bp
    from backend.routes.favorite_routes import favorite_bp
    from backend.routes.history_routes import history_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(prompt_bp)
    app.register_blueprint(favorite_bp)
    app.register_blueprint(history_bp)

    with app.app_context():
        # Import models so db.create_all knows about them
        from backend.models.storyboard import SavedStoryboard, QueryHistory
        db.create_all()

    return app

app = create_app()

if __name__ == '__main__':
    # For local development you can enable debug with FLASK_DEBUG=1
    debug_env = os.getenv('FLASK_DEBUG', '1')
    debug = debug_env in ('1', 'true', 'True')
    app.run(host='0.0.0.0', debug=debug)
