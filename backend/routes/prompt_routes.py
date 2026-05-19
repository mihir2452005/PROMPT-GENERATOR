
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.services.openai_service import generate_ai_prompts, get_supported_platforms

prompt_bp = Blueprint('prompts', __name__)

@prompt_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate():
    data = request.json or {}
    topic = data.get('topic')
    mood = data.get('mood')
    platform = data.get('platform', 'general')
    count = min(int(data.get('count', 5)), 10)  # Max 10

    if not topic or not mood:
        return jsonify({'error': 'Topic and mood are required'}), 400

    prompts = generate_ai_prompts(topic, mood, platform, count)

    return jsonify({'prompts': prompts, 'platform': platform})

@prompt_bp.route('/platforms')
def platforms():
    return jsonify(get_supported_platforms())

@prompt_bp.route('/trends')
def trends():
    return jsonify([
        {'title': 'Cyberpunk Cityscape', 'topic': 'neon-lit cyberpunk city at night', 'mood': 'futuristic, neon-noir'},
        {'title': 'Ethereal Fantasy Forest', 'topic': 'magical enchanted forest with glowing particles', 'mood': 'mystical, dreamy'},
        {'title': 'Ocean Sunset Timelapse', 'topic': 'golden sunset over calm ocean waves', 'mood': 'peaceful, cinematic'},
        {'title': 'Urban Street Photography', 'topic': 'busy city street in the rain with reflections', 'mood': 'moody, atmospheric'},
        {'title': 'Space Nebula Journey', 'topic': 'flying through a colorful nebula in deep space', 'mood': 'epic, cosmic'},
        {'title': 'Cozy Anime Room', 'topic': 'cozy lo-fi anime room with rain outside window', 'mood': 'warm, nostalgic'}
    ])
