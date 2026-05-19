
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.storyboard import SavedStoryboard

favorite_bp = Blueprint('favorites', __name__)

@favorite_bp.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorites():
    user_id = int(get_jwt_identity())
    favs = SavedStoryboard.query.filter_by(user_id=user_id).order_by(SavedStoryboard.created_at.desc()).all()
    return jsonify([f.to_dict() for f in favs])

@favorite_bp.route('/favorites', methods=['POST'])
@jwt_required()
def add_favorite():
    user_id = int(get_jwt_identity())
    data = request.json or {}
    topic = data.get('topic')
    mood = data.get('mood')
    platform = data.get('platform')
    content = data.get('content')

    if not content:
        return jsonify({'error': 'Content is required'}), 400

    # Avoid duplicate favorites of the exact same content for this user
    existing = SavedStoryboard.query.filter_by(user_id=user_id, content=content).first()
    if existing:
        return jsonify({'message': 'Already in favorites', 'favorite': existing.to_dict()})

    fav = SavedStoryboard(
        user_id=user_id,
        topic=topic,
        mood=mood,
        platform=platform,
        content=content
    )
    db.session.add(fav)
    db.session.commit()

    return jsonify({'message': 'Added to favorites', 'favorite': fav.to_dict()}), 201

@favorite_bp.route('/favorites/<int:fav_id>', methods=['DELETE'])
@jwt_required()
def delete_favorite(fav_id):
    user_id = int(get_jwt_identity())
    fav = SavedStoryboard.query.filter_by(id=fav_id, user_id=user_id).first()

    if not fav:
        return jsonify({'error': 'Favorite not found'}), 404

    db.session.delete(fav)
    db.session.commit()

    return jsonify({'message': 'Favorite removed'})
