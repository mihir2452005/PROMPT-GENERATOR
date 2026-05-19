
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.services.openai_service import generate_ai_prompt

prompt_bp = Blueprint('prompts', __name__)

@prompt_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate():
    data = request.json or {}
    topic = data.get('topic')
    mood = data.get('mood')

    if not topic or not mood:
        return jsonify({'error': 'Topic and mood are required'}), 400

    prompt = generate_ai_prompt(topic, mood)

    return jsonify({'prompt':prompt})

@prompt_bp.route('/trends')
def trends():
    return jsonify([
        {'title':'Rainy Anime'},
        {'title':'Dreamcore'},
        {'title':'Peaceful Morning'}
    ])
