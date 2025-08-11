from flask import Blueprint

# Provide url_prefix-less blueprint; strict_slashes handled at app level
articles_bp = Blueprint('articles', __name__)

from . import routes
