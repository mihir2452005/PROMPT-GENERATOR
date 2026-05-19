
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
from backend.app import db
from backend.models.user import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 400

    user = User(
        email=email,
        password=generate_password_hash(password)
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'registered'})

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    # Fix: Prevent backend crash if user signed up via Google and has no password hash
    if not user.password:
        return jsonify({'error': 'This account was created using Google Sign-In. Please click the Google Login button.'}), 400

    if not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_access_token(identity=str(user.id))

    return jsonify({'token': token})

@auth_bp.route('/login/google', methods=['POST'])
def google_login():
    data = request.json or {}
    credential = data.get('credential')

    if not credential:
        return jsonify({'error': 'No credential provided'}), 400

    CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')

    # Fix: Clear configuration check to prevent cryptic crashes if client ID is missing
    if not CLIENT_ID or CLIENT_ID.strip() in ('', 'YOUR_GOOGLE_CLIENT_ID'):
        return jsonify({
            'error': 'Google Client ID is not configured on the backend. Please add the GOOGLE_CLIENT_ID environment variable to Render.'
        }), 500

    try:
        # Verify the Google ID token
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            audience=CLIENT_ID
        )

        email = idinfo.get('email')

        if not email:
            return jsonify({'error': 'Google token did not contain an email address'}), 400

        # Check if email is verified by Google
        if not idinfo.get('email_verified', False):
            return jsonify({'error': 'Google email address is not verified'}), 400

        user = User.query.filter_by(email=email).first()

        if not user:
            user = User(email=email)
            db.session.add(user)
            db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return jsonify({'token': access_token})

    except ValueError as e:
        return jsonify({'error': f'Google verification failed: {str(e)}'}), 401
    except Exception as e:
        return jsonify({'error': f'Google authentication service error: {str(e)}'}), 500
