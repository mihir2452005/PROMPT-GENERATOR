
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

    return jsonify({'message':'registered'})

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({'error':'invalid credentials'}),401

    if not check_password_hash(user.password, password):
        return jsonify({'error':'invalid credentials'}),401

    token = create_access_token(identity=str(user.id))

    return jsonify({'token':token})

@auth_bp.route('/login/google', methods=['POST'])
def google_login():
    data = request.json or {}
    token = data.get('credential')

    if not token:
        return jsonify({'error': 'No credential provided'}), 400

    try:
        # Verify the Google token. 
        # In production, set GOOGLE_CLIENT_ID env var to your actual Client ID.
        CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID')
        
        # If testing with placeholder, we might bypass strict client ID check or it will fail.
        # We specify the Client ID if we have one. If we don't pass it, it verifies the signature but not audience.
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID if CLIENT_ID != 'YOUR_GOOGLE_CLIENT_ID' else None)

        email = idinfo.get('email')
        
        if not email:
            return jsonify({'error': 'Google token did not contain an email'}), 400

        user = User.query.filter_by(email=email).first()

        if not user:
            # Create a new user for this Google account
            user = User(email=email)
            db.session.add(user)
            db.session.commit()

        # Generate our own JWT token
        access_token = create_access_token(identity=str(user.id))
        return jsonify({'token': access_token})

    except ValueError as e:
        return jsonify({'error': f'Invalid Google token: {str(e)}'}), 401
