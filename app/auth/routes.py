from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.auth import auth_bp
from app.models import User, Role
from app import db, bcrypt
import re
from email_validator import validate_email, EmailNotValidError

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    email = data['email'].lower().strip()
    password = data['password']
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Create access token
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role.name
        }
    }), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['email', 'password', 'full_name', 'role_id']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    email = data['email'].lower().strip()
    password = data['password']
    full_name = data['full_name'].strip()
    role_id = data['role_id']
    
    # Validate email
    try:
        validate_email(email)
    except EmailNotValidError:
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Check if email already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    # Validate password
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400
    
    if not re.search(r'[a-z]', password):
        return jsonify({'error': 'Password must contain at least one lowercase letter'}), 400
    
    if not re.search(r'[A-Z]', password):
        return jsonify({'error': 'Password must contain at least one uppercase letter'}), 400
    
    if not re.search(r'\d', password):
        return jsonify({'error': 'Password must contain at least one digit'}), 400
    
    if not re.search(r'[!@#$%^&*]', password):
        return jsonify({'error': 'Password must contain at least one special character (!@#$%^&*)'}), 400
    
    # Check if role exists
    role = Role.query.get(role_id)
    if not role:
        return jsonify({'error': 'Invalid role'}), 400
    
    # Hash password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    # Create user
    user = User(
        email=email,
        password=hashed_password,
        full_name=full_name,
        role_id=role_id
    )
    
    try:
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role.name
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create user'}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'role': user.role.name
    }), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update fields if provided
    if 'email' in data:
        email = data['email'].lower().strip()
        try:
            validate_email(email)
        except EmailNotValidError:
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user and existing_user.id != user.id:
            return jsonify({'error': 'Email already registered'}), 409
        
        user.email = email
    
    if 'full_name' in data:
        full_name = data['full_name'].strip()
        if len(full_name) < 2:
            return jsonify({'error': 'Full name must be at least 2 characters long'}), 400
        
        # Normalize name (first letter uppercase, rest lowercase)
        full_name = ' '.join(word.capitalize() for word in full_name.split())
        user.full_name = full_name
    
    if 'password' in data:
        password = data['password']
        
        # Validate password
        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        if not re.search(r'[a-z]', password):
            return jsonify({'error': 'Password must contain at least one lowercase letter'}), 400
        
        if not re.search(r'[A-Z]', password):
            return jsonify({'error': 'Password must contain at least one uppercase letter'}), 400
        
        if not re.search(r'\d', password):
            return jsonify({'error': 'Password must contain at least one digit'}), 400
        
        if not re.search(r'[!@#$%^&*]', password):
            return jsonify({'error': 'Password must contain at least one special character (!@#$%^&*)'}), 400
        
        user.password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    try:
        db.session.commit()
        
        return jsonify({
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role.name
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile'}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    
    if not data or not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400
    
    email = data['email'].lower().strip()
    
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # TODO: Implement email sending functionality
    # For now, just return success message
    return jsonify({'message': 'Password reset link sent to your email'}), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current password and new password are required'}), 400
    
    current_password = data['current_password']
    new_password = data['new_password']
    
    # Verify current password
    if not bcrypt.check_password_hash(user.password, current_password):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    # Validate new password
    if len(new_password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400
    
    if not re.search(r'[a-z]', new_password):
        return jsonify({'error': 'Password must contain at least one lowercase letter'}), 400
    
    if not re.search(r'[A-Z]', new_password):
        return jsonify({'error': 'Password must contain at least one uppercase letter'}), 400
    
    if not re.search(r'\d', new_password):
        return jsonify({'error': 'Password must contain at least one digit'}), 400
    
    if not re.search(r'[!@#$%^&*]', new_password):
        return jsonify({'error': 'Password must contain at least one special character (!@#$%^&*)'}), 400
    
    # Update password
    user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    
    try:
        db.session.commit()
        return jsonify({'message': 'Password updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update password'}), 500
