from flask import Blueprint, request, jsonify
from functools import wraps
from backend.extensions import db
from backend.models.user import User
from backend.models.storyboard import SavedStoryboard, QueryHistory
import os

admin_bp = Blueprint('admin', __name__)

# ──────────────────────────────────────────────────────
# Admin Authentication via hardcoded env-var credentials
# Set ADMIN_SECRET in your environment (Render, .env, etc.)
# Default dev secret: "metaprompt-admin-2026"
# ──────────────────────────────────────────────────────

def get_admin_secret() -> str:
    return os.getenv('ADMIN_SECRET', 'metaprompt-admin-2026')


def admin_required(f):
    """Decorator: validates the X-Admin-Secret header on every admin request."""
    @wraps(f)
    def decorated(*args, **kwargs):
        secret = request.headers.get('X-Admin-Secret', '')
        if not secret or secret != get_admin_secret():
            return jsonify({'error': 'Unauthorized — invalid admin credentials'}), 401
        return f(*args, **kwargs)
    return decorated


# ── Admin Login (validates secret and returns confirmation) ──────────────
@admin_bp.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.json or {}
    secret = data.get('secret', '')
    if secret == get_admin_secret():
        return jsonify({'authenticated': True, 'message': 'Admin access granted'})
    return jsonify({'error': 'Invalid admin secret'}), 401


# ── Dashboard Stats ─────────────────────────────────────────────────────
@admin_bp.route('/admin/stats', methods=['GET'])
@admin_required
def admin_stats():
    total_users = User.query.count()
    total_queries = QueryHistory.query.count()
    total_favorites = SavedStoryboard.query.count()

    # Users who signed up via Google (no password hash stored)
    google_users = User.query.filter(
        (User.password == None) | (User.password == '')  # noqa: E711
    ).count()
    email_users = total_users - google_users

    # Users with API keys configured
    users_with_api_key = User.query.filter(
        User.openai_key != None,  # noqa: E711
        User.openai_key != ''
    ).count()

    return jsonify({
        'total_users': total_users,
        'total_queries': total_queries,
        'total_favorites': total_favorites,
        'google_users': google_users,
        'email_users': email_users,
        'users_with_api_key': users_with_api_key
    })


# ── List All Users ──────────────────────────────────────────────────────
@admin_bp.route('/admin/users', methods=['GET'])
@admin_required
def admin_list_users():
    users = User.query.order_by(User.id.desc()).all()
    result = []
    for u in users:
        # Count user-specific stats
        query_count = QueryHistory.query.filter_by(user_id=u.id).count()
        fav_count = SavedStoryboard.query.filter_by(user_id=u.id).count()

        login_method = 'google' if (not u.password or u.password == '') else 'email'

        # Mask the API key for admin view
        masked_api_key = ''
        if u.openai_key:
            masked_api_key = f"{u.openai_key[:8]}...{u.openai_key[-4:]}" if len(u.openai_key) > 12 else u.openai_key

        result.append({
            'id': u.id,
            'email': u.email,
            'login_method': login_method,
            'has_password': bool(u.password),
            'has_api_key': bool(u.openai_key),
            'masked_api_key': masked_api_key,
            'query_count': query_count,
            'favorite_count': fav_count
        })

    return jsonify(result)


# ── Get Single User Detail + Their Full History ─────────────────────────
@admin_bp.route('/admin/users/<int:user_id>', methods=['GET'])
@admin_required
def admin_user_detail(user_id: int):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    queries = QueryHistory.query.filter_by(user_id=user_id).order_by(QueryHistory.created_at.desc()).all()
    favorites = SavedStoryboard.query.filter_by(user_id=user_id).order_by(SavedStoryboard.created_at.desc()).all()

    login_method = 'google' if (not user.password or user.password == '') else 'email'

    return jsonify({
        'id': user.id,
        'email': user.email,
        'login_method': login_method,
        'has_api_key': bool(user.openai_key),
        'queries': [q.to_dict() for q in queries],
        'favorites': [f.to_dict() for f in favorites]
    })


# ── Delete a User (admin power) ────────────────────────────────────────
@admin_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def admin_delete_user(user_id: int):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Cascade delete: remove all user's queries and favorites first
    QueryHistory.query.filter_by(user_id=user_id).delete()
    SavedStoryboard.query.filter_by(user_id=user_id).delete()
    db.session.delete(user)
    db.session.commit()

    return jsonify({'message': f'User {user.email} and all their data deleted'})


# ── Get All Query History (global, for admin overview) ──────────────────
@admin_bp.route('/admin/queries', methods=['GET'])
@admin_required
def admin_all_queries():
    queries = QueryHistory.query.order_by(QueryHistory.created_at.desc()).limit(100).all()
    result = []
    for q in queries:
        user = User.query.get(q.user_id)
        result.append({
            **q.to_dict(),
            'user_email': user.email if user else 'Deleted User'
        })
    return jsonify(result)
