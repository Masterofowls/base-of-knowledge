from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.categories import categories_bp
from app.models import TopCategory, Subcategory, Category, Group, InstitutionType, Speciality, EducationForm, AdmissionYear, City, SchoolClass, User
from app import db
import re

@categories_bp.route('/top-categories', methods=['GET'])
def get_top_categories():
    """Get all top categories"""
    top_categories = TopCategory.query.all()
    
    categories_data = []
    for category in top_categories:
        category_data = {
            'id': category.id,
            'slug': category.slug,
            'name': category.name,
            'institution_type_id': category.institution_type_id,
            'subcategories': []
        }
        
        # Get subcategories
        for subcategory in category.subcategories:
            subcategory_data = {
                'id': subcategory.id,
                'slug': subcategory.slug,
                'name': subcategory.name
            }
            category_data['subcategories'].append(subcategory_data)
        
        categories_data.append(category_data)
    
    return jsonify(categories_data), 200

@categories_bp.route('/top-categories', methods=['POST'])
@jwt_required()
def create_top_category():
    """Create a new top category"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role.name not in ['Администратор', 'Редактор']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['name', 'slug']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    name = data['name'].strip()
    slug = data['slug'].strip()
    institution_type_id = data.get('institution_type_id')
    
    # Validate name
    if len(name) < 3:
        return jsonify({'error': 'Name must be at least 3 characters long'}), 400
    
    # Normalize name (first letter uppercase, rest lowercase)
    name = ' '.join(word.capitalize() for word in name.split())
    
    # Validate slug
    if not re.match(r'^[a-z0-9-]+$', slug):
        return jsonify({'error': 'Slug must contain only lowercase letters, numbers, and hyphens'}), 400
    
    # Check if slug already exists
    if TopCategory.query.filter_by(slug=slug).first():
        return jsonify({'error': 'Slug already exists'}), 409
    
    # Create category
    category = TopCategory(
        name=name,
        slug=slug,
        institution_type_id=institution_type_id
    )
    
    try:
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'id': category.id,
            'name': category.name,
            'slug': category.slug,
            'message': 'Top category created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create top category'}), 500

@categories_bp.route('/top-categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_top_category(category_id):
    """Update a top category"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role.name not in ['Администратор', 'Редактор']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    category = TopCategory.query.get_or_404(category_id)
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update fields if provided
    if 'name' in data:
        name = data['name'].strip()
        if len(name) < 3:
            return jsonify({'error': 'Name must be at least 3 characters long'}), 400
        
        # Normalize name
        name = ' '.join(word.capitalize() for word in name.split())
        category.name = name
    
    if 'slug' in data:
        slug = data['slug'].strip()
        if not re.match(r'^[a-z0-9-]+$', slug):
            return jsonify({'error': 'Slug must contain only lowercase letters, numbers, and hyphens'}), 400
        
        # Check if slug already exists
        existing_category = TopCategory.query.filter_by(slug=slug).first()
        if existing_category and existing_category.id != category.id:
            return jsonify({'error': 'Slug already exists'}), 409
        
        category.slug = slug
    
    if 'institution_type_id' in data:
        category.institution_type_id = data['institution_type_id']
    
    try:
        db.session.commit()
        
        return jsonify({
            'id': category.id,
            'name': category.name,
            'slug': category.slug,
            'message': 'Top category updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update top category'}), 500

@categories_bp.route('/top-categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_top_category(category_id):
    """Delete a top category"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    
    category = TopCategory.query.get_or_404(category_id)
    
    try:
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({'message': 'Top category deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete top category'}), 500

@categories_bp.route('/subcategories', methods=['GET'])
def get_subcategories():
    """Get subcategories with optional top category filter"""
    top_category_id = request.args.get('top_category_id', type=int)
    
    query = Subcategory.query
    
    if top_category_id:
        query = query.filter_by(top_category_id=top_category_id)
    
    subcategories = query.all()
    
    subcategories_data = []
    for subcategory in subcategories:
        subcategory_data = {
            'id': subcategory.id,
            'slug': subcategory.slug,
            'name': subcategory.name,
            'top_category_id': subcategory.top_category_id,
            'top_category_name': subcategory.top_category.name if subcategory.top_category else None
        }
        subcategories_data.append(subcategory_data)
    
    return jsonify(subcategories_data), 200

@categories_bp.route('/subcategories', methods=['POST'])
@jwt_required()
def create_subcategory():
    """Create a new subcategory"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role.name not in ['Администратор', 'Редактор']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['name', 'slug', 'top_category_id']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    name = data['name'].strip()
    slug = data['slug'].strip()
    top_category_id = data['top_category_id']
    
    # Validate name
    if len(name) < 3:
        return jsonify({'error': 'Name must be at least 3 characters long'}), 400
    
    # Normalize name
    name = ' '.join(word.capitalize() for word in name.split())
    
    # Validate slug
    if not re.match(r'^[a-z0-9-]+$', slug):
        return jsonify({'error': 'Slug must contain only lowercase letters, numbers, and hyphens'}), 400
    
    # Check if top category exists
    top_category = TopCategory.query.get(top_category_id)
    if not top_category:
        return jsonify({'error': 'Top category not found'}), 404
    
    # Check if slug already exists for this top category
    if Subcategory.query.filter_by(top_category_id=top_category_id, slug=slug).first():
        return jsonify({'error': 'Slug already exists for this top category'}), 409
    
    # Create subcategory
    subcategory = Subcategory(
        name=name,
        slug=slug,
        top_category_id=top_category_id
    )
    
    try:
        db.session.add(subcategory)
        db.session.commit()
        
        return jsonify({
            'id': subcategory.id,
            'name': subcategory.name,
            'slug': subcategory.slug,
            'top_category_id': subcategory.top_category_id,
            'message': 'Subcategory created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create subcategory'}), 500

@categories_bp.route('/subcategories/<int:subcategory_id>', methods=['PUT'])
@jwt_required()
def update_subcategory(subcategory_id):
    """Update a subcategory"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role.name not in ['Администратор', 'Редактор']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    subcategory = Subcategory.query.get_or_404(subcategory_id)
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update fields if provided
    if 'name' in data:
        name = data['name'].strip()
        if len(name) < 3:
            return jsonify({'error': 'Name must be at least 3 characters long'}), 400
        
        # Normalize name
        name = ' '.join(word.capitalize() for word in name.split())
        subcategory.name = name
    
    if 'slug' in data:
        slug = data['slug'].strip()
        if not re.match(r'^[a-z0-9-]+$', slug):
            return jsonify({'error': 'Slug must contain only lowercase letters, numbers, and hyphens'}), 400
        
        # Check if slug already exists for this top category
        existing_subcategory = Subcategory.query.filter_by(
            top_category_id=subcategory.top_category_id, 
            slug=slug
        ).first()
        if existing_subcategory and existing_subcategory.id != subcategory.id:
            return jsonify({'error': 'Slug already exists for this top category'}), 409
        
        subcategory.slug = slug
    
    if 'top_category_id' in data:
        top_category = TopCategory.query.get(data['top_category_id'])
        if not top_category:
            return jsonify({'error': 'Top category not found'}), 404
        subcategory.top_category_id = data['top_category_id']
    
    try:
        db.session.commit()
        
        return jsonify({
            'id': subcategory.id,
            'name': subcategory.name,
            'slug': subcategory.slug,
            'top_category_id': subcategory.top_category_id,
            'message': 'Subcategory updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update subcategory'}), 500

@categories_bp.route('/subcategories/<int:subcategory_id>', methods=['DELETE'])
@jwt_required()
def delete_subcategory(subcategory_id):
    """Delete a subcategory"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    
    subcategory = Subcategory.query.get_or_404(subcategory_id)
    
    try:
        db.session.delete(subcategory)
        db.session.commit()
        
        return jsonify({'message': 'Subcategory deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete subcategory'}), 500

@categories_bp.route('/groups', methods=['GET'])
def get_groups():
    """Get groups with filtering options"""
    institution_type_id = request.args.get('institution_type_id', type=int)
    speciality_id = request.args.get('speciality_id', type=int)
    education_form_id = request.args.get('education_form_id', type=int)
    admission_year_id = request.args.get('admission_year_id', type=int)
    city_id = request.args.get('city_id', type=int)
    search = (request.args.get('search') or '').strip()
    
    query = Group.query
    
    if institution_type_id:
        query = query.filter_by(institution_type_id=institution_type_id)
    
    if speciality_id:
        query = query.filter_by(speciality_id=speciality_id)
    
    if education_form_id:
        query = query.filter_by(education_form_id=education_form_id)
    
    if admission_year_id:
        query = query.filter_by(admission_year_id=admission_year_id)
    
    if city_id:
        query = query.filter_by(city_id=city_id)
    
    if search:
        # Basic ilike search by display_name or speciality code/name
        from sqlalchemy import or_
        query = query.join(Speciality, isouter=True).filter(
            or_(
                Group.display_name.ilike(f"%{search}%"),
                Speciality.code.ilike(f"%{search}%"),
                Speciality.name.ilike(f"%{search}%")
            )
        )

    groups = query.order_by(Group.display_name.asc()).all()
    
    groups_data = []
    for group in groups:
        group_data = {
            'id': group.id,
            'display_name': group.display_name,
            'speciality': {
                'id': group.speciality.id,
                'code': group.speciality.code,
                'name': group.speciality.name
            } if group.speciality else None,
            'education_form': {
                'id': group.education_form.id,
                'name': group.education_form.name
            } if group.education_form else None,
            'admission_year': {
                'id': group.admission_year.id,
                'year': group.admission_year.year
            } if group.admission_year else None,
            'city': {
                'id': group.city.id,
                'name': group.city.name
            } if group.city else None,
            'school_class': {
                'id': group.school_class.id,
                'name': group.school_class.name
            } if group.school_class else None
        }
        groups_data.append(group_data)
    
    return jsonify(groups_data), 200

@categories_bp.route('/groups/<int:group_id>', methods=['DELETE'])
@jwt_required()
def delete_group(group_id):
    """Delete a group (admin only)"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    group = Group.query.get_or_404(group_id)
    try:
        db.session.delete(group)
        db.session.commit()
        return jsonify({'message': 'Group deleted successfully'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete group'}), 500

@categories_bp.route('/groups/<int:group_id>', methods=['GET'])
def get_group(group_id):
    group = Group.query.get_or_404(group_id)
    data = {
        'id': group.id,
        'display_name': group.display_name,
        'speciality': {
            'id': group.speciality.id,
            'code': group.speciality.code,
            'name': group.speciality.name
        } if group.speciality else None,
        'education_form': {
            'id': group.education_form.id,
            'name': group.education_form.name
        } if group.education_form else None,
        'admission_year': {
            'id': group.admission_year.id,
            'year': group.admission_year.year
        } if group.admission_year else None,
        'city': {
            'id': group.city.id,
            'name': group.city.name
        } if group.city else None,
        'school_class': {
            'id': group.school_class.id,
            'name': group.school_class.name
        } if group.school_class else None,
        'institution_type_id': group.institution_type_id
    }
    return jsonify(data), 200

@categories_bp.route('/groups/seed', methods=['POST'])
@jwt_required()
def seed_groups():
    """Create several demo groups for testing (admin only)."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    # pick first available references
    spec = Speciality.query.first()
    form = EducationForm.query.first()
    year = AdmissionYear.query.first()
    inst = InstitutionType.query.first()
    city = City.query.first()
    if not all([spec, form, year, inst]):
        return jsonify({'error': 'Missing reference data to seed groups'}), 400
    names = ['ИТ-101', 'ИТ-201', 'Дизайн-301', 'Эконом-102', 'Юр-202']
    created = 0
    for name in names:
        if not Group.query.filter_by(display_name=name).first():
            g = Group(
                display_name=name,
                speciality_id=spec.id,
                education_form_id=form.id,
                admission_year_id=year.id,
                institution_type_id=inst.id,
                school_class_id=None,
                city_id=city.id if city else None
            )
            db.session.add(g)
            created += 1
    try:
        if created:
            db.session.commit()
        return jsonify({'message': f'Seeded {created} groups'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to seed groups'}), 500

@categories_bp.route('/groups', methods=['POST'])
@jwt_required()
def create_group():
    """Create a new group"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['display_name', 'speciality_id', 'education_form_id', 'admission_year_id', 'institution_type_id']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    display_name = data['display_name'].strip()
    speciality_id = data['speciality_id']
    education_form_id = data['education_form_id']
    admission_year_id = data['admission_year_id']
    institution_type_id = data['institution_type_id']
    school_class_id = data.get('school_class_id')
    city_id = data.get('city_id')
    
    # Validate display name
    if len(display_name) < 3:
        return jsonify({'error': 'Display name must be at least 3 characters long'}), 400
    
    # Check if display name already exists
    if Group.query.filter_by(display_name=display_name).first():
        return jsonify({'error': 'Display name already exists'}), 409
    
    # Validate foreign keys
    if not Speciality.query.get(speciality_id):
        return jsonify({'error': 'Speciality not found'}), 404
    
    if not EducationForm.query.get(education_form_id):
        return jsonify({'error': 'Education form not found'}), 404
    
    if not AdmissionYear.query.get(admission_year_id):
        return jsonify({'error': 'Admission year not found'}), 404
    
    if not InstitutionType.query.get(institution_type_id):
        return jsonify({'error': 'Institution type not found'}), 404
    
    if school_class_id and not SchoolClass.query.get(school_class_id):
        return jsonify({'error': 'School class not found'}), 404
    
    if city_id and not City.query.get(city_id):
        return jsonify({'error': 'City not found'}), 404
    
    # Create group
    group = Group(
        display_name=display_name,
        speciality_id=speciality_id,
        education_form_id=education_form_id,
        admission_year_id=admission_year_id,
        institution_type_id=institution_type_id,
        school_class_id=school_class_id,
        city_id=city_id
    )
    
    try:
        db.session.add(group)
        db.session.commit()
        
        return jsonify({
            'id': group.id,
            'display_name': group.display_name,
            'message': 'Group created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create group'}), 500

@categories_bp.route('/groups/<int:group_id>', methods=['PUT'])
@jwt_required()
def update_group(group_id):
    """Update group fields"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    group = Group.query.get_or_404(group_id)
    data = request.get_json() or {}
    if 'display_name' in data:
        name = (data['display_name'] or '').strip()
        if len(name) < 3:
            return jsonify({'error': 'Display name must be at least 3 characters long'}), 400
        group.display_name = name
    if 'speciality_id' in data:
        group.speciality_id = data['speciality_id']
    if 'education_form_id' in data:
        group.education_form_id = data['education_form_id']
    if 'admission_year_id' in data:
        group.admission_year_id = data['admission_year_id']
    if 'institution_type_id' in data:
        group.institution_type_id = data['institution_type_id']
    if 'school_class_id' in data:
        group.school_class_id = data['school_class_id']
    if 'city_id' in data:
        group.city_id = data['city_id']
    try:
        db.session.commit()
        return jsonify({'message':'Group updated'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error':'Failed to update group'}), 500

@categories_bp.route('/cities', methods=['GET'])
def get_cities():
    """Get all cities (no authorization required)"""
    cities = City.query.order_by(City.name).all()
    
    cities_data = []
    for city in cities:
        cities_data.append({
            'id': city.id,
            'name': city.name
        })
    
    return jsonify(cities_data), 200

@categories_bp.route('/specialities', methods=['GET'])
def get_specialities():
    """Get all specialities (no authorization required)"""
    institution_type_id = request.args.get('institution_type_id', type=int)
    
    query = Speciality.query
    if institution_type_id:
        query = query.filter_by(institution_type_id=institution_type_id)
    
    specialities = query.order_by(Speciality.name).all()
    
    specialities_data = []
    for speciality in specialities:
        specialities_data.append({
            'id': speciality.id,
            'code': speciality.code,
            'name': speciality.name,
            'institution_type_id': speciality.institution_type_id
        })
    
    return jsonify(specialities_data), 200

@categories_bp.route('/education-forms', methods=['GET'])
def get_education_forms():
    """Get all education forms (no authorization required)"""
    institution_type_id = request.args.get('institution_type_id', type=int)
    
    query = EducationForm.query
    if institution_type_id:
        query = query.filter_by(institution_type_id=institution_type_id)
    
    education_forms = query.order_by(EducationForm.name).all()
    
    education_forms_data = []
    for form in education_forms:
        education_forms_data.append({
            'id': form.id,
            'name': form.name,
            'institution_type_id': form.institution_type_id
        })
    
    return jsonify(education_forms_data), 200

@categories_bp.route('/admission-years', methods=['GET'])
def get_admission_years():
    """Get all admission years (no authorization required)"""
    institution_type_id = request.args.get('institution_type_id', type=int)
    
    query = AdmissionYear.query
    if institution_type_id:
        query = query.filter_by(institution_type_id=institution_type_id)
    
    admission_years = query.order_by(AdmissionYear.year.desc()).all()
    
    admission_years_data = []
    for year in admission_years:
        admission_years_data.append({
            'id': year.id,
            'year': year.year,
            'description': year.description,
            'is_active': year.is_active,
            'institution_type_id': year.institution_type_id
        })
    
    return jsonify(admission_years_data), 200

@categories_bp.route('/school-classes', methods=['GET'])
def get_school_classes():
    """Get all school classes (no authorization required)"""
    institution_type_id = request.args.get('institution_type_id', type=int)
    
    query = SchoolClass.query
    if institution_type_id:
        query = query.filter_by(institution_type_id=institution_type_id)
    
    school_classes = query.order_by(SchoolClass.name).all()
    
    school_classes_data = []
    for school_class in school_classes:
        school_classes_data.append({
            'id': school_class.id,
            'name': school_class.name,
            'institution_type_id': school_class.institution_type_id
        })
    
    return jsonify(school_classes_data), 200

@categories_bp.route('/institution-types', methods=['GET'])
def get_institution_types():
    """Get all institution types (no authorization required)"""
    institution_types = InstitutionType.query.order_by(InstitutionType.name).all()
    
    institution_types_data = []
    for institution_type in institution_types:
        institution_types_data.append({
            'id': institution_type.id,
            'name': institution_type.name
        })
    
    return jsonify(institution_types_data), 200

# Aux endpoints to support student login fields
@categories_bp.route('/base-classes', methods=['GET'])
def get_base_classes():
    """Return available base classes for admission (9 or 11)."""
    return jsonify([9, 11]), 200

@categories_bp.route('/courses', methods=['GET'])
def get_courses():
    """Return available course numbers. Optional ?max= param (default 4)."""
    try:
        max_val = int(request.args.get('max') or 4)
    except Exception:
        max_val = 4
    if max_val < 1:
        max_val = 1
    return jsonify(list(range(1, max_val + 1))), 200
