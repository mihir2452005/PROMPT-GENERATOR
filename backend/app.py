from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
import logging
from dotenv import load_dotenv
from backend.extensions import db

# Configure system-wide basic logger to print beautiful, human-readable stdout/stderr logs
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
)
logger = logging.getLogger('backend')

# Load environment variables from .env files in root or backend directories
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
load_dotenv(os.path.join(parent_dir, '.env'))
load_dotenv(os.path.join(current_dir, '.env'))
load_dotenv()

jwt = JWTManager()


def create_app():
    app = Flask(__name__)
    app.logger.setLevel(logging.INFO)
    app.logger.info("Initializing Meta Prompt Studio Flask Application...")
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
    from backend.routes.video_routes import video_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(prompt_bp)
    app.register_blueprint(favorite_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(video_bp)

    with app.app_context():
        # Import models so db.create_all knows about them
        from backend.models.storyboard import SavedStoryboard, QueryHistory
        db.create_all()

    @app.before_request
    def log_incoming_request():
        # Mask authorization header for privacy/security
        headers = dict(request.headers)
        if 'Authorization' in headers:
            headers['Authorization'] = 'Bearer [MASKED]'
        app.logger.info(
            f"📥 HTTP [START] | {request.method} {request.path} | "
            f"IP: {request.remote_addr} | "
            f"Query: {request.args.to_dict()} | "
            f"Payload: {request.get_json(silent=True) or ''}"
        )

    @app.after_request
    def log_outgoing_response(response):
        app.logger.info(
            f"📤 HTTP [END] | {request.method} {request.path} -> "
            f"Status: {response.status_code}"
        )
        return response

    @app.errorhandler(Exception)
    def handle_unhandled_exception(error):
        app.logger.error(
            f"❌ PIPELINE ERROR OCCURRED during request {request.method} {request.path}!\n"
            f"Error details: {str(error)}", 
            exc_info=True
        )
        return jsonify({
            'error': 'Internal Server Error',
            'message': str(error)
        }), 500

    @app.route('/health')
    def health():
        return {"status": "healthy"}, 200

    return app

app = create_app()

if __name__ == '__main__':
    # For local development you can enable debug with FLASK_DEBUG=1
    debug_env = os.getenv('FLASK_DEBUG', '1')
    debug = debug_env in ('1', 'true', 'True')
    app.run(host='0.0.0.0', debug=debug)
