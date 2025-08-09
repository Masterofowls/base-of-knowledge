from flask import Blueprint

articles_bp = Blueprint('articles', __name__)

from . import routes
