from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager, verify_jwt_in_request, get_jwt
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
    # Avoid trailing-slash redirects that break CORS preflight
    app.url_map.strict_slashes = False

    # Конфигурация
    if config_name == 'development':
        # PostgreSQL по умолчанию (локально). Можно переопределить через переменную окружения DATABASE_URL
        # Формат: postgresql+psycopg2://user:password@host:port/dbname
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql+psycopg2://postgres:password@localhost/knowledge_base')
    else:
        db_url = os.getenv('DATABASE_URL')
        # Резерв: если нет DATABASE_URL — используем SQLite для локального демо
        if not db_url:
            db_url = 'sqlite:///data.db'
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # Tokens don't expire for now
    app.config['JWT_TOKEN_LOCATION'] = ['headers']

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # CORS configuration for frontend origins
    frontend_origin_env = os.getenv('FRONTEND_ORIGIN')
    default_allowed_origins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'https://kb-front-astral-f046b152.netlify.app',
    ]
    allowed_origins = [frontend_origin_env] if frontend_origin_env else default_allowed_origins

    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    # Register blueprints
    from app.auth import auth_bp
    from app.articles import articles_bp
    from app.categories import categories_bp
    from app.users import users_bp
    from app.media import media_bp
    from app.filters import filters_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(articles_bp, url_prefix='/api/articles')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(media_bp, url_prefix='/api/media')
    app.register_blueprint(filters_bp, url_prefix='/api/filters')

    # Ensure database tables exist (useful for SQLite/demo deployments)
    with app.app_context():
        try:
            db.create_all()
            # Run minimal idempotent migrations for Neon/MySQL
            try:
                from app.db_migrations import run_startup_migrations
                run_startup_migrations(db)
            except Exception:
                pass
        except Exception:
            pass

    @app.before_request
    def enforce_active_admin_session():
        # Only for API paths
        try:
            from flask import request
            path = request.path or ''
            if not path.startswith('/api'):
                return
            # Public endpoints skip
            public_paths = (
                '/api/auth/login',
                '/api/auth/register',
                '/api/auth/student-login',
            )
            if path in public_paths:
                return
            # If no/invalid JWT, let @jwt_required on endpoints handle it
            try:
                verify_jwt_in_request(optional=True)
            except Exception:
                return
            try:
                claims = get_jwt()
            except Exception:
                return
            sid = claims.get('sid')
            if not sid:
                # non-admin/student tokens: allow
                return
            # validate sid in DB
            from app.models import AdminSession
            from app import db as _db
            sess = AdminSession.query.filter_by(sid=sid, revoked_at=None).first()
            if not sess:
                # revoke access
                from flask import jsonify
                return jsonify({'error': 'session_revoked'}), 401
        except Exception:
            # Fail open to avoid breaking non-protected routes; protected ones still need @jwt_required
            return

    @app.route('/')
    def root_status():
        return jsonify({
            'status': 'ok',
            'app': 'knowledge-base',
            'version': '1.0',
            'docs': '/api/*',
        }), 200

    return app
