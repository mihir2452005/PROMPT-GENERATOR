
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.services.openai_service import generate_ai_prompt

prompt_bp = Blueprint('prompts', __name__)

@prompt_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate():
    data = request.json

    prompt = generate_ai_prompt(
        data.get('topic'),
        data.get('mood')
    )

    return jsonify({'prompt':prompt})

@prompt_bp.route('/trends')
def trends():
    return jsonify([
        {'title':'Rainy Anime'},
        {'title':'Dreamcore'},
        {'title':'Peaceful Morning'}
    ])
