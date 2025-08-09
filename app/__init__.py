from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app(config_name='development'):
    app = Flask(__name__)
    
    # Configuration
    if config_name == 'development':
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'mysql+pymysql://root:password@localhost/knowledge_base')
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # Tokens don't expire for now
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app)
    
    # Register blueprints
    from app.auth import auth_bp
    from app.articles import articles_bp
    from app.categories import categories_bp
    from app.users import users_bp
    from app.media import media_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(articles_bp, url_prefix='/api/articles')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(media_bp, url_prefix='/api/media')

    @app.route('/')
    def root_status():
        return jsonify({
            'status': 'ok',
            'app': 'knowledge-base',
            'version': '1.0',
            'docs': '/api/*',
        }), 200
    
    return app
