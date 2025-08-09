from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.users import users_bp
from app.models import User, Role
from app import db, bcrypt
import re
from email_validator import validate_email, EmailNotValidError
import secrets
import string

@users_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users (admin only)"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    role_id = request.args.get('role_id', type=int)
    search = request.args.get('search', '').strip()
    
    # Build query
    query = User.query
    
    # Apply filters
    if role_id:
        query = query.filter_by(role_id=role_id)
    
    if search:
        query = query.filter(User.full_name.ilike(f'%{search}%'))
    
    # Order by full name
    query = query.order_by(User.full_name)
    
    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    users = pagination.items
    
    # Prepare response
    users_data = []
    for user in users:
        user_data = {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': {
                'id': user.role.id,
                'name': user.role.name
            }
        }
        users_data.append(user_data)
    
    return jsonify({
        'users': users_data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    }), 200

@users_bp.route('/', methods=['POST'])
@jwt_required()
def create_user():
    """Create a new user (admin only)"""
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    
    if not current_user or current_user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['email', 'full_name', 'role_id']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    email = data['email'].lower().strip()
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
    
    # Validate full name
    if len(full_name) < 2:
        return jsonify({'error': 'Full name must be at least 2 characters long'}), 400
    
    # Normalize name
    full_name = ' '.join(word.capitalize() for word in full_name.split())
    
    # Check if role exists
    role = Role.query.get(role_id)
    if not role:
        return jsonify({'error': 'Invalid role'}), 400
    
    # Generate temporary password
    temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    hashed_password = bcrypt.generate_password_hash(temp_password).decode('utf-8')
    
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
        
        return jsonify({
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role.name,
            'temp_password': temp_password,
            'message': 'User created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create user'}), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get a specific user (admin only)"""
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user or current_user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.get_or_404(user_id)
    
    user_data = {
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'role': {
            'id': user.role.id,
            'name': user.role.name
        }
    }
    
    return jsonify(user_data), 200

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update a user (admin only)"""
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user or current_user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.get_or_404(user_id)
    
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
        
        # Normalize name
        full_name = ' '.join(word.capitalize() for word in full_name.split())
        user.full_name = full_name
    
    if 'role_id' in data:
        role = Role.query.get(data['role_id'])
        if not role:
            return jsonify({'error': 'Invalid role'}), 400
        user.role_id = data['role_id']
    
    try:
        db.session.commit()
        
        return jsonify({
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role.name,
            'message': 'User updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update user'}), 500

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete a user (admin only)"""
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user or current_user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.get_or_404(user_id)
    
    # Prevent admin from deleting themselves
    if user.id == current_user.id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    try:
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete user'}), 500

@users_bp.route('/<int:user_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_user_password(user_id):
    """Reset user password (admin only)"""
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user or current_user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.get_or_404(user_id)
    
    # Generate new temporary password
    temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    hashed_password = bcrypt.generate_password_hash(temp_password).decode('utf-8')
    
    user.password = hashed_password
    
    try:
        db.session.commit()
        
        return jsonify({
            'id': user.id,
            'email': user.email,
            'temp_password': temp_password,
            'message': 'Password reset successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to reset password'}), 500

@users_bp.route('/roles', methods=['GET'])
@jwt_required()
def get_roles():
    """Get all roles"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    
    roles = Role.query.all()
    
    roles_data = []
    for role in roles:
        role_data = {
            'id': role.id,
            'name': role.name
        }
        roles_data.append(role_data)
    
    return jsonify(roles_data), 200

@users_bp.route('/bulk-import', methods=['POST'])
@jwt_required()
def bulk_import_users():
    """Bulk import users from CSV (admin only)"""
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user or current_user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'File must be a CSV'}), 400
    
    try:
        # Read CSV file
        content = file.read().decode('utf-8')
        lines = content.strip().split('\n')
        
        imported_users = []
        errors = []
        
        for i, line in enumerate(lines[1:], 2):  # Skip header
            try:
                # Parse CSV line (semicolon separated)
                parts = line.split(';')
                if len(parts) < 3:
                    errors.append(f'Line {i}: Invalid format')
                    continue
                
                login = parts[0].strip()
                last_name = parts[1].strip()
                first_name = parts[2].strip()
                
                # Validate data
                if not login or not last_name or not first_name:
                    errors.append(f'Line {i}: Missing required fields')
                    continue
                
                # Check if user already exists
                if User.query.filter_by(email=login).first():
                    errors.append(f'Line {i}: User already exists')
                    continue
                
                # Generate temporary password
                temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
                hashed_password = bcrypt.generate_password_hash(temp_password).decode('utf-8')
                
                # Create user
                user = User(
                    email=login,
                    password=hashed_password,
                    full_name=f'{last_name} {first_name}',
                    role_id=3  # Default role (Авторизованный читатель)
                )
                
                db.session.add(user)
                imported_users.append({
                    'email': login,
                    'full_name': f'{last_name} {first_name}',
                    'temp_password': temp_password
                })
                
            except Exception as e:
                errors.append(f'Line {i}: {str(e)}')
        
        if imported_users:
            db.session.commit()
        
        return jsonify({
            'imported_users': imported_users,
            'errors': errors,
            'message': f'Successfully imported {len(imported_users)} users'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to import users: {str(e)}'}), 500
