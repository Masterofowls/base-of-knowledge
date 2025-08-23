from flask import request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.categories import categories_bp
from app.models import TopCategory, Subcategory, Category, Group, InstitutionType, Speciality, EducationForm, AdmissionYear, City, SchoolClass, User
from app import db
import re
from datetime import datetime

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
    """Get groups with filtering options.
    Rules:
    - If city is selected, keep only the city filter (ignore other criteria).
    - School classes appear only when institution is a school (handled on client, but API supports filtering by school_class_id if provided).
    - Group as last optional criteria (query already supports it via exact filters when provided).
    """
    institution_type_id = request.args.get('institution_type_id', type=int)
    speciality_id = request.args.get('speciality_id', type=int)
    education_form_id = request.args.get('education_form_id', type=int)
    admission_year_id = request.args.get('admission_year_id', type=int)
    city_id = request.args.get('city_id', type=int)
    search = (request.args.get('search') or '').strip()
    school_class_id = request.args.get('school_class_id', type=int)
    
    query = Group.query
    
    # Diagram rules:
    # - If city chosen, prioritize only city filter
    # - If institution is School, only class filter is relevant
    if city_id:
        query = query.filter_by(city_id=city_id)
    else:
        if institution_type_id:
            query = query.filter_by(institution_type_id=institution_type_id)
            # Detect school by name to simplify (id-based check could be done on client as well)
            inst = InstitutionType.query.get(institution_type_id)
            is_school = bool(inst and inst.name.lower() == 'школа')
        else:
            is_school = False

        if is_school:
            # For schools we only consider class. Other academic filters are ignored.
            if school_class_id:
                query = query.filter_by(school_class_id=school_class_id)
        else:
            if speciality_id:
                query = query.filter_by(speciality_id=speciality_id)
            if education_form_id:
                query = query.filter_by(education_form_id=education_form_id)
            if admission_year_id:
                query = query.filter_by(admission_year_id=admission_year_id)
            if school_class_id:
                query = query.filter_by(school_class_id=school_class_id)
    
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
            'base_class': getattr(group, 'base_class', None),
            'institution_type_id': group.institution_type_id,
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
    # Prevent deletion if there are linked categories
    linked = Category.query.filter_by(group_id=group.id).first()
    if linked:
        return jsonify({'error': 'Group has linked categories, archive or merge before deleting'}), 409
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
        'institution_type_id': group.institution_type_id,
        'base_class': getattr(group, 'base_class', None)
    }
    return jsonify(data), 200

@categories_bp.route('/groups/import', methods=['POST'])
@jwt_required()
def import_groups_csv():
    """Import groups from CSV. Columns: display_name,speciality_id,education_form_id,admission_year_id,institution_type_id,school_class_id,city_id"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json() or {}
    csv_text = (data.get('csv') or '').strip()
    if not csv_text:
        return jsonify({'error': 'csv is required'}), 400
    import csv, io
    reader = csv.DictReader(io.StringIO(csv_text))
    created = 0
    skipped = 0
    for row in reader:
        name = (row.get('display_name') or '').strip()
        if not name:
            skipped += 1
            continue
        if Group.query.filter_by(display_name=name).first():
            skipped += 1
            continue
        g = Group(
            display_name=name,
            speciality_id=int(row['speciality_id']) if row.get('speciality_id') else None,
            education_form_id=int(row['education_form_id']) if row.get('education_form_id') else None,
            admission_year_id=int(row['admission_year_id']) if row.get('admission_year_id') else None,
            institution_type_id=int(row['institution_type_id']) if row.get('institution_type_id') else None,
            school_class_id=int(row['school_class_id']) if row.get('school_class_id') else None,
            city_id=int(row['city_id']) if row.get('city_id') else None,
        )
        db.session.add(g)
        created += 1
    try:
        if created:
            db.session.commit()
        return jsonify({'created': created, 'skipped': skipped}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Import failed'}), 500

@categories_bp.route('/groups/export', methods=['GET'])
@jwt_required()
def export_groups_csv():
    """Export groups to CSV."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    import csv, io
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['display_name','speciality_id','education_form_id','admission_year_id','institution_type_id','school_class_id','city_id','base_class'])
    for g in Group.query.order_by(Group.display_name.asc()).all():
        writer.writerow([g.display_name, g.speciality_id, g.education_form_id, g.admission_year_id, g.institution_type_id, g.school_class_id, g.city_id, getattr(g, 'base_class', None)])
    csv_data = output.getvalue()
    return Response(csv_data, mimetype='text/csv', headers={'Content-Disposition': 'attachment; filename=groups.csv'})

@categories_bp.route('/groups/merge', methods=['POST'])
@jwt_required()
def merge_groups():
    """Merge source_group_id into target_group_id and archive the source group."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    payload = request.get_json() or {}
    src_id = payload.get('source_group_id')
    tgt_id = payload.get('target_group_id')
    if not src_id or not tgt_id or src_id == tgt_id:
        return jsonify({'error': 'Invalid group ids'}), 400
    src = Group.query.get_or_404(src_id)
    tgt = Group.query.get_or_404(tgt_id)
    try:
        # reattach categories from src to target
        Category.query.filter_by(group_id=src.id).update({Category.group_id: tgt.id})
        # archive source
        if hasattr(src, 'is_archived'):
            setattr(src, 'is_archived', True)
        db.session.add(src)
        # audit log
        try:
            db.session.execute(db.text("INSERT INTO group_audit_logs (group_id,user_id,action,details) VALUES (:gid,:uid,'merge',:d)"),
                               {'gid': src.id, 'uid': user.id, 'd': f'merged into {tgt.id}'})
        except Exception:
            pass
        db.session.commit()
        return jsonify({'message': 'Merged and archived source group'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Merge failed'}), 500

@categories_bp.route('/groups/<int:group_id>/archive', methods=['POST'])
@jwt_required()
def archive_group(group_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role.name != 'Администратор':
        return jsonify({'error': 'Unauthorized'}), 403
    grp = Group.query.get_or_404(group_id)
    try:
        if hasattr(grp, 'is_archived'):
            setattr(grp, 'is_archived', True)
            db.session.add(grp)
        try:
            db.session.execute(db.text("INSERT INTO group_audit_logs (group_id,user_id,action,details) VALUES (:gid,:uid,'archive',NULL)"),
                               {'gid': grp.id, 'uid': user.id})
        except Exception:
            pass
        db.session.commit()
        return jsonify({'message': 'Archived'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Archive failed'}), 500

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
    
    required_base = ['display_name', 'institution_type_id']
    for field in required_base:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    display_name = data['display_name'].strip()
    institution_type_id = data['institution_type_id']
    speciality_id = data.get('speciality_id')
    education_form_id = data.get('education_form_id')
    admission_year_id = data.get('admission_year_id')
    school_class_id = data.get('school_class_id')
    city_id = data.get('city_id')
    base_class = data.get('base_class')
    
    # Validate display name
    if len(display_name) < 3:
        return jsonify({'error': 'Display name must be at least 3 characters long'}), 400
    
    # Check if display name already exists
    if Group.query.filter_by(display_name=display_name).first():
        return jsonify({'error': 'Display name already exists'}), 409
    
    # Validate institution type first
    inst = InstitutionType.query.get(institution_type_id)
    if not inst:
        return jsonify({'error': 'Institution type not found'}), 404

    is_school = inst.name.lower() == 'школа'

    # For schools: require school_class_id; other academic refs are ignored
    if is_school:
        if not school_class_id:
            return jsonify({'error': 'school_class_id is required for schools'}), 400
        if not SchoolClass.query.get(school_class_id):
            return jsonify({'error': 'School class not found'}), 404
        # Normalize: ignore speciality/form/year for schools
        speciality_id = None
        education_form_id = None
        admission_year_id = None
    else:
        # For college/university: require education_form_id and at least one of speciality/admission_year
        if not education_form_id:
            return jsonify({'error': 'education_form_id is required for non-school institutions'}), 400
        if not EducationForm.query.get(education_form_id):
            return jsonify({'error': 'Education form not found'}), 404
        if not (speciality_id or admission_year_id):
            return jsonify({'error': 'Provide speciality_id or admission_year_id'}), 400
        if speciality_id and not Speciality.query.get(speciality_id):
            return jsonify({'error': 'Speciality not found'}), 404
        if admission_year_id and not AdmissionYear.query.get(admission_year_id):
            return jsonify({'error': 'Admission year not found'}), 404
    
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
    if hasattr(group, 'base_class') and base_class is not None:
        try:
            group.base_class = int(base_class)
        except Exception:
            pass
    
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
    if 'base_class' in data and hasattr(group, 'base_class'):
        try:
            group.base_class = int(data['base_class']) if data['base_class'] is not None else None
        except Exception:
            pass
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

# Aggregated audience dictionaries with "all-*" helpers
@categories_bp.route('/audience/options', methods=['GET'])
def get_audience_options():
    """Return audience dictionaries including optional institution filtering.
    Query: ?institution_type_id=ID to scope forms/specialities/years/classes.
    Includes special "all" sentinel options for front-ends.
    """
    institution_type_id = request.args.get('institution_type_id', type=int)

    # Cities
    cities = City.query.order_by(City.name).all()
    cities_data = [{'id': None, 'name': 'Все города'}] + [
        {'id': c.id, 'name': c.name} for c in cities
    ]

    # Education forms (map to ru labels)
    forms_query = EducationForm.query
    if institution_type_id:
        forms_query = forms_query.filter_by(institution_type_id=institution_type_id)
    forms = forms_query.order_by(EducationForm.name).all()
    default_forms = [
        {'id': -1, 'name': 'Очное'},
        {'id': -2, 'name': 'Заочное'},
        {'id': -3, 'name': 'Очно-заочное'},
    ]
    forms_data = [{'id': None, 'name': 'Все форматы'}]
    if forms:
        forms_data += [{'id': f.id, 'name': f.name} for f in forms]
    else:
        forms_data += default_forms

    # Specialities
    specs_query = Speciality.query
    if institution_type_id:
        specs_query = specs_query.filter_by(institution_type_id=institution_type_id)
    specs = specs_query.order_by(Speciality.name).all()
    specs_data = [{'id': None, 'code': '*', 'name': 'Все специальности'}] + [
        {'id': s.id, 'code': s.code, 'name': s.name} for s in specs
    ]

    # Admission years
    years_query = AdmissionYear.query
    if institution_type_id:
        years_query = years_query.filter_by(institution_type_id=institution_type_id)
    years = years_query.order_by(AdmissionYear.year.desc()).all()
    years_data = [{'id': None, 'year': 0, 'label': 'Все годы поступления'}] + [
        {'id': y.id, 'year': y.year, 'label': str(y.year)} for y in years
    ]

    # School classes visible only for schools
    classes_query = SchoolClass.query
    if institution_type_id:
        classes_query = classes_query.filter_by(institution_type_id=institution_type_id)
    classes = classes_query.order_by(SchoolClass.name).all()
    classes_data = [{'id': None, 'name': 'Все классы'}] + [
        {'id': cl.id, 'name': cl.name} for cl in classes
    ]

    return jsonify({
        'cities': cities_data,
        'education_forms': forms_data,
        'specialities': specs_data,
        'admission_years': years_data,
        'school_classes': classes_data,
    }), 200

# Aux endpoints to support student login fields
@categories_bp.route('/base-classes', methods=['GET'])
def get_base_classes():
    """Return available base classes for admission: 9 or 11."""
    return jsonify([9, 11]), 200

@categories_bp.route('/courses', methods=['GET'])
def get_courses():
    """Return available course numbers. Prefer institution_type_id rule: college=3, university=4.
    Fallback to ?max= for manual override.
    """
    inst_id = request.args.get('institution_type_id', type=int)
    max_val = None
    if inst_id:
        inst = InstitutionType.query.get(inst_id)
        if inst:
            name = (inst.name or '').lower()
            if name == 'колледж':
                max_val = 3
            elif name == 'вуз':
                max_val = 4
    if not max_val:
        try:
            max_val = int(request.args.get('max') or 4)
        except Exception:
            max_val = 4
    if max_val < 1:
        max_val = 1
    return jsonify(list(range(1, max_val + 1))), 200


@categories_bp.route('/lookups/ensure', methods=['POST'])
@jwt_required()
def ensure_lookups():
    """Ensure required lookup data exist (admin only).
    Creates (idempotently): institution types, cities, education forms, specialities,
    admission years (current-3..current+1), and school classes including college base options.
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role.name not in ['Администратор', 'Редактор']:
        return jsonify({'error': 'Unauthorized'}), 403

    def get_or_create(model, defaults=None, **kwargs):
        inst = model.query.filter_by(**kwargs).first()
        if inst:
            return inst, False
        params = dict(kwargs)
        if defaults:
            params.update(defaults)
        inst = model(**params)
        db.session.add(inst)
        return inst, True

    created = {
        'institution_types': 0,
        'cities': 0,
        'education_forms': 0,
        'specialities': 0,
        'admission_years': 0,
        'school_classes': 0,
    }

    # Institution types
    inst_names = ['Школа', 'Колледж', 'Вуз']
    inst_map = {}
    for n in inst_names:
        inst, was = get_or_create(InstitutionType, name=n)
        inst_map[n] = inst
        if was:
            created['institution_types'] += 1

    # Cities
    city_names = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Ростов-на-Дону']
    for n in city_names:
        _, was = get_or_create(City, name=n)
        if was:
            created['cities'] += 1

    # Education forms
    forms_map = {
        'Школа': ['Очная'],
        'Колледж': ['Очная', 'Заочная', 'Очно-заочная', 'Дистанционная'],
        'Вуз': ['Очная', 'Заочная', 'Очно-заочная'],
    }
    for inst_name, forms in forms_map.items():
        for fname in forms:
            _, was = get_or_create(EducationForm, name=fname, institution_type_id=inst_map[inst_name].id)
            if was:
                created['education_forms'] += 1

    # Specialities (codes + names)
    specs_map = {
        'Колледж': [
            ('09.02.07', 'Информационные системы и программирование'),
            ('42.02.01', 'Реклама'),
            ('09.02.06', 'Сетевое и системное администрирование'),
            ('54.02.01', 'Дизайн по отраслям'),
            ('09.02.10', 'Разработка компьютерных игр, дополненной и виртуальной реальности'),
            ('54.01.20', 'Графический дизайнер'),
            ('09.02.13', 'Интеграция решений с применением технологий искусственного интеллекта'),
            ('49.02.03', 'Киберспорт'),
            ('10.02.05', 'Обеспечение информационной безопасности автоматизированных систем'),
            ('15.02.18', 'Техническая эксплуатация и обслуживание роботизированного производств'),
        ],
        'Вуз': [
            ('09.03.03', 'Прикладная информатика'),
            ('42.03.01', 'Реклама и связи с общественностью'),
            ('54.03.01', 'Дизайн'),
        ],
    }
    for inst_name, items in specs_map.items():
        for code, sname in items:
            _, was = get_or_create(Speciality, code=code, institution_type_id=inst_map[inst_name].id, defaults={'name': sname})
            if was:
                created['specialities'] += 1

    # Admission years: current-3..current+1 per institution
    year_now = datetime.utcnow().year
    years = [year_now - 3, year_now - 2, year_now - 1, year_now, year_now + 1]
    for inst_name in inst_names:
        for y in years:
            _, was = get_or_create(AdmissionYear, year=y, institution_type_id=inst_map[inst_name].id)
            if was:
                created['admission_years'] += 1

    # School classes: school 9/10/11; college base-of 9/11
    for n in ['9', '10', '11']:
        _, was = get_or_create(SchoolClass, name=n, institution_type_id=inst_map['Школа'].id)
        if was:
            created['school_classes'] += 1
    for n in ['на базе 9-го класса', 'на базе 11-го класса']:
        _, was = get_or_create(SchoolClass, name=n, institution_type_id=inst_map['Колледж'].id)
        if was:
            created['school_classes'] += 1

    try:
        db.session.commit()
        return jsonify({'message': 'Lookup data ensured', 'created': created}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to ensure lookups'}), 500
