
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from backend.app import db
from backend.models.user import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json

    user = User(
        email=data['email'],
        password=generate_password_hash(data['password'])
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({'message':'registered'})

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json

    user = User.query.filter_by(email=data['email']).first()

    if not user:
        return jsonify({'error':'invalid'}),401

    if not check_password_hash(user.password,data['password']):
        return jsonify({'error':'invalid'}),401

    token = create_access_token(identity=user.id)

    return jsonify({'token':token})
