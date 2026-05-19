
from backend.extensions import db
from datetime import datetime

class SavedStoryboard(db.Model):
    __tablename__ = 'saved_storyboard'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    topic = db.Column(db.String(255))
    mood = db.Column(db.String(255))
    platform = db.Column(db.String(50))
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, user_id: int, topic: str, mood: str, platform: str, content: str):
        self.user_id = user_id
        self.topic = topic
        self.mood = mood
        self.platform = platform
        self.content = content

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'topic': self.topic,
            'mood': self.mood,
            'platform': self.platform,
            'content': self.content,
            'created_at': self.created_at.isoformat()
        }

class QueryHistory(db.Model):
    __tablename__ = 'query_history'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    topic = db.Column(db.String(255))
    mood = db.Column(db.String(255))
    platform = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, user_id: int, topic: str, mood: str, platform: str):
        self.user_id = user_id
        self.topic = topic
        self.mood = mood
        self.platform = platform

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'topic': self.topic,
            'mood': self.mood,
            'platform': self.platform,
            'created_at': self.created_at.isoformat()
        }

