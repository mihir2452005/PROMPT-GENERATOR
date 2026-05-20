
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.storyboard import QueryHistory

history_bp = Blueprint('history', __name__)

@history_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = int(get_jwt_identity())
    # Return 10 most recent search queries
    history_items = QueryHistory.query.filter_by(user_id=user_id).order_by(QueryHistory.created_at.desc()).limit(10).all()
    return jsonify([item.to_dict() for item in history_items])

@history_bp.route('/history', methods=['DELETE'])
@jwt_required()
def clear_history():
    user_id = int(get_jwt_identity())
    QueryHistory.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({'message': 'Query history cleared'})

@history_bp.route('/history/<int:history_id>', methods=['DELETE'])
@jwt_required()
def delete_history_item(history_id):
    user_id = int(get_jwt_identity())
    item = QueryHistory.query.filter_by(id=history_id, user_id=user_id).first()
    if not item:
        return jsonify({'error': 'History item not found'}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'History item deleted'})

