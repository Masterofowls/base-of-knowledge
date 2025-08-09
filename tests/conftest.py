#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pytest
import tempfile
import os
from app import create_app, db
from app.models import Role, User, InstitutionType, City, EducationForm, AdmissionYear, Speciality
from flask_bcrypt import Bcrypt

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Create a temporary file to serve as the database
    db_fd, db_path = tempfile.mkstemp()
    
    # Set environment variables for testing
    os.environ['FLASK_ENV'] = 'testing'
    os.environ['DATABASE_URL'] = f'sqlite:///{db_path}'
    os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret'
    
    app = create_app('testing')
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'SECRET_KEY': 'test-secret-key',
        'JWT_SECRET_KEY': 'test-jwt-secret',
        'WTF_CSRF_ENABLED': False
    })

    with app.app_context():
        db.create_all()
        setup_test_data()
        yield app
        
    try:
        os.close(db_fd)
        os.unlink(db_path)
    except (OSError, PermissionError):
        # Windows может блокировать файл, игнорируем
        pass

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

def setup_test_data():
    """Set up test data for the database."""
    bcrypt = Bcrypt()
    
    # Create roles (check if they exist first)
    roles_data = [
        ('Администратор',),
        ('Редактор',),
        ('Авторизованный читатель',),
        ('Гость',)
    ]
    
    for role_name in roles_data:
        role = Role.query.filter_by(name=role_name[0]).first()
        if not role:
            role = Role(name=role_name[0])
            db.session.add(role)
    
    db.session.commit()
    
    # Get role objects
    admin_role = Role.query.filter_by(name='Администратор').first()
    editor_role = Role.query.filter_by(name='Редактор').first()
    reader_role = Role.query.filter_by(name='Авторизованный читатель').first()
    guest_role = Role.query.filter_by(name='Гость').first()
    
    # Create institution types
    college = InstitutionType(name='Колледж')
    university = InstitutionType(name='Вуз')
    school = InstitutionType(name='Школа')
    
    db.session.add_all([college, university, school])
    db.session.commit()
    
    # Create cities
    moscow = City(name='Москва')
    spb = City(name='Санкт-Петербург')
    kazan = City(name='Казань')
    
    db.session.add_all([moscow, spb, kazan])
    db.session.commit()
    
    # Create education forms
    full_time = EducationForm(name='Очная')
    part_time = EducationForm(name='Заочная')
    
    db.session.add_all([full_time, part_time])
    db.session.commit()
    
    # Create admission years
    year_2023 = AdmissionYear(year=2023)
    year_2024 = AdmissionYear(year=2024)
    
    db.session.add_all([year_2023, year_2024])
    db.session.commit()
    
    # Create specialities
    it_spec = Speciality(
        code='09.02.07',
        name='Информационные системы и программирование',
        institution_type_id=college.id
    )
    design_spec = Speciality(
        code='38.02.01',
        name='Экономика и бухгалтерский учет',
        institution_type_id=college.id
    )
    
    db.session.add_all([it_spec, design_spec])
    db.session.commit()
    
    # Create test admin user
    admin_password = bcrypt.generate_password_hash('Admin123!').decode('utf-8')
    admin_user = User(
        email='admin@test.com',
        password=admin_password,
        full_name='Тестовый Администратор',
        role_id=admin_role.id
    )
    
    # Create test editor user
    editor_password = bcrypt.generate_password_hash('Editor123!').decode('utf-8')
    editor_user = User(
        email='editor@test.com',
        password=editor_password,
        full_name='Тестовый Редактор',
        role_id=editor_role.id
    )
    
    db.session.add_all([admin_user, editor_user])
    db.session.commit()

@pytest.fixture
def admin_token(client):
    """Get admin JWT token for authenticated requests."""
    response = client.post('/api/auth/login', json={
        'email': 'admin@test.com',
        'password': 'Admin123!'
    })
    return response.json['access_token']

@pytest.fixture
def editor_token(client):
    """Get editor JWT token for authenticated requests."""
    response = client.post('/api/auth/login', json={
        'email': 'editor@test.com',
        'password': 'Editor123!'
    })
    return response.json['access_token']
