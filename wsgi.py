"""
WSGI entry point for Render/Gunicorn.
"""
from app import create_app

app = create_app('production')

# Render expects variable named `app`

