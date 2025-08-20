from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.auth import auth_bp
from app.models import User, Role, AdminSession, EditLock
from app.models import InstitutionType, EducationForm, Speciality, AdmissionYear, City, SchoolClass, Group
from app import db, bcrypt
import re
from email_validator import validate_email, EmailNotValidError
import secrets
from datetime import datetime

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
    
    # Enforce single active admin session (by role) — revoke others
    if user.role and user.role.name.lower() in ('admin', 'editor'):
        existing = AdminSession.query.filter_by(user_id=user.id, revoked_at=None).all()
        for s in existing:
            s.revoked_at = datetime.utcnow()
        sid = secrets.token_hex(24)
        sess = AdminSession(user_id=user.id, sid=sid, user_agent=request.headers.get('User-Agent'), ip_address=request.remote_addr)
        db.session.add(sess)
        db.session.commit()
        additional = { 'sid': sid }
    else:
        additional = {}

    # Create access token with session id claim when applicable
    access_token = create_access_token(identity=str(user.id), additional_claims=additional)
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role.name
        }
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = int(get_jwt_identity())
    claims = getattr(request, 'jwt_extended_claims', None)
    sid = None
    try:
        # flask-jwt-extended >=4 attaches claims via get_jwt()
        from flask_jwt_extended import get_jwt
        sid = get_jwt().get('sid')
    except Exception:
        pass
    if sid:
        sess = AdminSession.query.filter_by(user_id=user_id, sid=sid, revoked_at=None).first()
        if sess:
            sess.revoked_at = datetime.utcnow()
            db.session.commit()
    return jsonify({'message': 'logged out'}), 200


@auth_bp.route('/edit-locks/acquire', methods=['POST'])
@jwt_required()
def acquire_lock():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    rtype = data.get('resource_type')
    rid = data.get('resource_id')
    if not rtype or not rid:
        return jsonify({'error': 'resource_type and resource_id are required'}), 400
    lock = EditLock.query.filter_by(resource_type=rtype, resource_id=rid).first()
    if lock and not lock.is_expired():
        if lock.user_id != user_id:
            return jsonify({'error': 'locked', 'by_user_id': lock.user_id}), 409
        # if same user, refresh
        lock.heartbeat_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'status': 'ok', 'lock_id': lock.id}), 200
    if lock and lock.is_expired():
        db.session.delete(lock)
        db.session.commit()
    new_lock = EditLock(resource_type=rtype, resource_id=rid, user_id=user_id)
    db.session.add(new_lock)
    db.session.commit()
    return jsonify({'status': 'ok', 'lock_id': new_lock.id}), 200


@auth_bp.route('/edit-locks/heartbeat', methods=['POST'])
@jwt_required()
def heartbeat_lock():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    rtype = data.get('resource_type')
    rid = data.get('resource_id')
    if not rtype or not rid:
        return jsonify({'error': 'resource_type and resource_id are required'}), 400
    lock = EditLock.query.filter_by(resource_type=rtype, resource_id=rid, user_id=user_id).first()
    if not lock:
        return jsonify({'error': 'no_lock'}), 404
    lock.heartbeat_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'status': 'ok'}), 200


@auth_bp.route('/edit-locks/release', methods=['POST'])
@jwt_required()
def release_lock():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    rtype = data.get('resource_type')
    rid = data.get('resource_id')
    if not rtype or not rid:
        return jsonify({'error': 'resource_type and resource_id are required'}), 400
    lock = EditLock.query.filter_by(resource_type=rtype, resource_id=rid, user_id=user_id).first()
    if lock:
        db.session.delete(lock)
        db.session.commit()
    return jsonify({'status': 'ok'}), 200

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


@auth_bp.route('/student-login', methods=['POST'])
def student_login_context():
    """Student login via academic filters (no password).
    Accepts institution and optional fields according to the diagram:
    - Required: institution_type_id
    - If school selected: require school_class_id; other academic filters are ignored
    - Else (college/university): require education_form_id, and at least one of (speciality_id, admission_year_id)
    Optional in both: city_id, group_id, course

    Returns a normalized context and a short-lived token with the context in claims.
    """
    data = request.get_json() or {}

    institution_type_id = data.get('institution_type_id')
    if not institution_type_id:
        return jsonify({'error': 'institution_type_id is required'}), 400

    inst = InstitutionType.query.get(institution_type_id)
    if not inst:
        return jsonify({'error': 'Institution type not found'}), 404

    # Optional common fields
    city_id = data.get('city_id')
    group_id = data.get('group_id')
    course = data.get('course')

    context = {
        'institution_type_id': inst.id,
        'institution_type': inst.name,
        'city_id': None,
        'group_id': None,
        'course': None,
        'school_class_id': None,
        'education_form_id': None,
        'speciality_id': None,
        'admission_year_id': None,
    }

    if city_id:
        city = City.query.get(city_id)
        if not city:
            return jsonify({'error': 'City not found'}), 404
        context['city_id'] = city.id

    if group_id:
        grp = Group.query.get(group_id)
        if not grp:
            return jsonify({'error': 'Group not found'}), 404
        context['group_id'] = grp.id

    if course is not None:
        try:
            context['course'] = int(course)
        except Exception:
            return jsonify({'error': 'course must be an integer'}), 400

    # Branch: School → only class remains
    if inst.name.lower() == 'школа':
        school_class_id = data.get('school_class_id')
        if not school_class_id:
            return jsonify({'error': 'school_class_id is required for schools'}), 400
        sc = SchoolClass.query.get(school_class_id)
        if not sc:
            return jsonify({'error': 'School class not found'}), 404
        if sc.institution_type_id != inst.id:
            return jsonify({'error': 'School class does not belong to the selected institution type'}), 400
        context['school_class_id'] = sc.id
    else:
        # College/University → need form and one of (speciality or admission year)
        education_form_id = data.get('education_form_id')
        speciality_id = data.get('speciality_id')
        admission_year_id = data.get('admission_year_id')

        if not education_form_id:
            return jsonify({'error': 'education_form_id is required'}), 400
        ef = EducationForm.query.get(education_form_id)
        if not ef:
            return jsonify({'error': 'Education form not found'}), 404
        if ef.institution_type_id != inst.id:
            return jsonify({'error': 'Education form does not belong to the selected institution type'}), 400
        context['education_form_id'] = ef.id

        # At least one of speciality or admission year
        if not speciality_id and not admission_year_id:
            return jsonify({'error': 'Provide speciality_id or admission_year_id'}), 400

        if speciality_id:
            sp = Speciality.query.get(speciality_id)
            if not sp:
                return jsonify({'error': 'Speciality not found'}), 404
            if sp.institution_type_id != inst.id:
                return jsonify({'error': 'Speciality does not belong to the selected institution type'}), 400
            context['speciality_id'] = sp.id

        if admission_year_id:
            ay = AdmissionYear.query.get(admission_year_id)
            if not ay:
                return jsonify({'error': 'Admission year not found'}), 404
            if ay.institution_type_id != inst.id:
                return jsonify({'error': 'Admission year does not belong to the selected institution type'}), 400
            context['admission_year_id'] = ay.id

    # Create a short-lived token that carries the context
    try:
        token = create_access_token(identity='student_ctx', additional_claims={'ctx': context})
    except Exception:
        # If token creation fails, still return context
        token = None

    return jsonify({'context': context, 'token': token}), 200
