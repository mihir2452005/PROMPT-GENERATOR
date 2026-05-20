from backend.extensions import db
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True)
    password = db.Column(db.String(255))
    openai_key = db.Column(db.String(255), nullable=True)

    def __init__(self, email: str, password=None, openai_key=None):
        self.email = email
        self.password = password
        self.openai_key = openai_key
