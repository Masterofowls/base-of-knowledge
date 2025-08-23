from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.articles import articles_bp
from app.models import Article, Category, TopCategory, Subcategory, Group, User, ArticleAuthor, ArticleCategory, ArticleMedia, ArticleMediaLink
from app.models import SchoolClass
from app.models import ArticleReaction, ReactionEmoji
from app.models import ArticleView
from app.models import City, Speciality, Group  # for bulk
from app import db
from datetime import datetime
import re
from sqlalchemy import or_, asc, desc
import requests

@articles_bp.route('/', methods=['GET'])
def get_articles():
    """Get articles with filtering options"""
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    top_category_id = request.args.get('top_category_id', type=int)
    subcategory_id = request.args.get('subcategory_id', type=int)
    group_id = request.args.get('group_id', type=int)
    is_published = request.args.get('is_published', type=bool)
    is_for_staff = request.args.get('is_for_staff', type=bool)
    is_actual = request.args.get('is_actual', type=bool)
    search = request.args.get('search', '').strip()
    date_from = request.args.get('date_from', type=str)
    date_to = request.args.get('date_to', type=str)
    # Remove separate message type control, keep only category/tag if needed
    tag = request.args.get('tag', type=str)
    # Core targeting is institution type + education form (+ speciality)
    institution_type_id = request.args.get('institution_type_id', type=int)
    education_form_id = request.args.get('education_form_id', type=int)
    speciality_id = request.args.get('speciality_id', type=int)
    # Array filters (multiple values)
    try:
        institution_type_ids = [int(x) for x in request.args.getlist('institution_type_ids') if str(x).isdigit()]
    except Exception:
        institution_type_ids = []
    try:
        education_form_ids = [int(x) for x in request.args.getlist('education_form_ids') if str(x).isdigit()]
    except Exception:
        education_form_ids = []
    try:
        speciality_ids = [int(x) for x in request.args.getlist('speciality_ids') if str(x).isdigit()]
    except Exception:
        speciality_ids = []
    try:
        city_ids = [int(x) for x in request.args.getlist('city_ids') if str(x).isdigit()]
    except Exception:
        city_ids = []
    try:
        admission_year_ids = [int(x) for x in request.args.getlist('admission_year_ids') if str(x).isdigit()]
    except Exception:
        admission_year_ids = []
    # Legacy/optional
    base_class = request.args.get('base_class', type=int)
    audience = request.args.get('audience', type=str)
    audience_city_id = request.args.get('audience_city_id', type=int)
    audience_course = request.args.get('audience_course', type=int)
    audience_admission_year_id = request.args.get('audience_admission_year_id', type=int)
    education_mode = request.args.get('education_mode', type=str)
    speciality_id = request.args.get('speciality_id', type=int)
    
    # Sorting and audience options
    sort_by = request.args.get('sort_by', default='created_at', type=str)
    sort_dir = request.args.get('sort_dir', default='desc', type=str)
    strict_audience = request.args.get('strict_audience', default=False, type=bool)
    view = request.args.get('view', type=str)  # 'common' | 'city'

    # Build query
    query = Article.query
    
    # Apply filters
    if top_category_id:
        query = query.join(ArticleCategory).join(Category).filter(Category.top_category_id == top_category_id)
    
    if subcategory_id:
        query = query.join(ArticleCategory).join(Category).filter(Category.subcategory_id == subcategory_id)
    
    if group_id:
        query = query.join(ArticleCategory).join(Category).filter(Category.group_id == group_id)
    
    if is_published is not None:
        query = query.filter(Article.is_published == is_published)
    
    if is_for_staff is not None:
        query = query.filter(Article.is_for_staff == is_for_staff)
    
    if is_actual is not None:
        query = query.filter(Article.is_actual == is_actual)
    
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Article.title.ilike(like),
                Article.content.ilike(like),
                Article.tag.ilike(like)
            )
        )
    # Date range
    if date_from:
        try:
            query = query.filter(Article.created_at >= datetime.fromisoformat(date_from))
        except Exception:
            pass
    if date_to:
        try:
            query = query.filter(Article.created_at <= datetime.fromisoformat(date_to))
        except Exception:
            pass
    if tag:
        query = query.filter(Article.tag == tag)
    if institution_type_id:
        query = query.filter(Article.speciality.has(Speciality.institution_type_id == institution_type_id))
    elif institution_type_ids:
        query = query.filter(Article.speciality.has(Speciality.institution_type_id.in_(institution_type_ids)))
    if education_form_id:
        query = query.filter(Article.education_form_id == education_form_id)
    elif education_form_ids:
        query = query.filter(Article.education_form_id.in_(education_form_ids))
    if speciality_id:
        query = query.filter(Article.speciality_id == speciality_id)
    elif speciality_ids:
        query = query.filter(Article.speciality_id.in_(speciality_ids))
    if base_class:
        query = query.filter(Article.base_class == base_class)
    if audience:
        query = query.filter(Article.audience == audience)
    if audience_city_id:
        query = query.filter(Article.audience_city_id == audience_city_id)
    elif city_ids:
        query = query.filter(Article.audience_city_id.in_(city_ids))
    if audience_course:
        query = query.filter(Article.audience_course == audience_course)
    if audience_admission_year_id:
        query = query.filter(Article.audience_admission_year_id == audience_admission_year_id)
    elif admission_year_ids:
        query = query.filter(Article.audience_admission_year_id.in_(admission_year_ids))
    if education_mode:
        query = query.filter(Article.education_mode == education_mode)
    if speciality_id:
        query = query.filter(Article.speciality_id == speciality_id)
    
    # Enforce strict audience if requested (exclude fully general posts)
    if strict_audience:
        from sqlalchemy import and_
        query = query.filter(
            and_(Article.audience.isnot(None), Article.audience != 'all')
        )

    # View toggle: 'common' shows only general posts; 'city' shows only city-targeted
    if view == 'common':
        query = query.filter(or_(Article.audience.is_(None), Article.audience == 'all'))
    elif view == 'city':
        query = query.filter(Article.audience == 'city')
    # If city filter provided, include city-targeted or general
    elif audience_city_id or city_ids:
        query = query.filter(or_(Article.audience == 'city', Article.audience == 'all'))

    # Sorting
    sort_map = {
        'created_at': Article.created_at,
        'updated_at': Article.updated_at,
        'title': Article.title
    }
    sort_column = sort_map.get(sort_by, Article.created_at)
    query = query.order_by(desc(sort_column) if sort_dir.lower() == 'desc' else asc(sort_column))
    
    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    articles = pagination.items
    
    # Prepare response
    articles_data = []
    for article in articles:
        # Get categories
        categories = []
        for article_category in article.categories:
            category = article_category.category
            category_data = {
                'id': category.id,
                'top_category': None,
                'subcategory': None,
                'group': None
            }
            
            if category.top_category:
                category_data['top_category'] = {
                    'id': category.top_category.id,
                    'name': category.top_category.name,
                    'slug': category.top_category.slug
                }
            
            if category.subcategory:
                category_data['subcategory'] = {
                    'id': category.subcategory.id,
                    'name': category.subcategory.name,
                    'slug': category.subcategory.slug
                }
            
            if category.group:
                category_data['group'] = {
                    'id': category.group.id,
                    'display_name': category.group.display_name
                }
            
            categories.append(category_data)
        
        # Get authors
        authors = []
        for author in article.authors:
            authors.append({
                'id': author.user.id,
                'full_name': author.user.full_name,
                'email': author.user.email
            })
        
        article_data = {
            'id': article.id,
            'title': article.title,
            'content': article.content,
            'created_at': article.created_at.isoformat(),
            'updated_at': article.updated_at.isoformat(),
            'is_published': article.is_published,
            'is_for_staff': article.is_for_staff,
            'is_actual': article.is_actual,
            'archive_at': article.archive_at.isoformat() if article.archive_at else None,
            'archived_at': article.archived_at.isoformat() if article.archived_at else None,
            'tag': article.tag,
            'base_class': article.base_class,
            'audience': article.audience,
            'audience_city_id': article.audience_city_id,
            'audience_course': article.audience_course,
            'audience_admission_year_id': article.audience_admission_year_id,
            'audience_courses': article.audience_courses,
            'education_mode': article.education_mode,
            'speciality_id': article.speciality_id,
            'categories': categories,
            'authors': authors
        }
        articles_data.append(article_data)
    
    return jsonify({
        'articles': articles_data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    }), 200

@articles_bp.route('/<int:article_id>', methods=['GET'])
def get_article(article_id):
    """Get a specific article by ID"""
    article = Article.query.get_or_404(article_id)
    
    # Increment views metric (anonymous allowed)
    try:
        from app.models import ArticleView
        view = ArticleView(article_id=article.id, user_id=None)
        db.session.add(view)
        # in-place counter to avoid heavy count()
        if hasattr(article, 'views_count'):
            article.views_count = (article.views_count or 0) + 1
        db.session.commit()
    except Exception:
        db.session.rollback()

    # Get categories
    categories = []
    for article_category in article.categories:
        category = article_category.category
        category_data = {
            'id': category.id,
            'top_category': None,
            'subcategory': None,
            'group': None
        }
        
        if category.top_category:
            category_data['top_category'] = {
                'id': category.top_category.id,
                'name': category.top_category.name,
                'slug': category.top_category.slug
            }
        
        if category.subcategory:
            category_data['subcategory'] = {
                'id': category.subcategory.id,
                'name': category.subcategory.name,
                'slug': category.subcategory.slug
            }
        
        if category.group:
            category_data['group'] = {
                'id': category.group.id,
                'display_name': category.group.display_name
            }
        
        categories.append(category_data)
    
    # Get authors
    authors = []
    for author in article.authors:
        authors.append({
            'id': author.user.id,
            'full_name': author.user.full_name,
            'email': author.user.email
        })
    
    # Get media
    media = []
    for media_link in article.media_links:
        media.append({
            'id': media_link.media.id,
            'media_type': media_link.media.media_type,
            'file_name': media_link.media.file_name,
            'mime_type': media_link.media.mime_type,
            'caption': media_link.media.caption,
            'position': media_link.position
        })
    
    article_data = {
        'id': article.id,
        'title': article.title,
        'content': article.content,
        'created_at': article.created_at.isoformat(),
        'updated_at': article.updated_at.isoformat(),
        'is_published': article.is_published,
        'is_for_staff': article.is_for_staff,
        'is_actual': article.is_actual,
        'archive_at': article.archive_at.isoformat() if article.archive_at else None,
        'archived_at': article.archived_at.isoformat() if article.archived_at else None,
        'categories': categories,
        'authors': authors,
        'media': media,
        'views_count': getattr(article, 'views_count', None)
    }
    
    return jsonify(article_data), 200

@articles_bp.route('/', methods=['POST'])
@jwt_required()
def create_article():
    """Create a new article"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['title', 'content']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    title = data['title'].strip()
    content = data['content']
    is_published = data.get('is_published', False)
    is_for_staff = data.get('is_for_staff', False)
    is_actual = data.get('is_actual', True)
    category_ids = data.get('category_ids', [])
    publish_scope = data.get('publish_scope') or {}
    # Optional display-only label: 'study' | 'group'
    incoming_tag = data.get('tag')
    
    # Validate title
    if len(title) < 3:
        return jsonify({'error': 'Title must be at least 3 characters long'}), 400
    
    # Create article
    import json
    # Map RU education forms to internal codes if posted as text
    ru_mode_map = {
        'Очное': 'full_time',
        'Заочное': 'distance',
        'Очно-заочное': 'mixed'
    }
    # Normalize arrays -> rules if compact multi-select provided
    rules = publish_scope.get('rules') if isinstance(publish_scope, dict) else None
    if not rules and isinstance(publish_scope, dict):
        mm_city = publish_scope.get('city_ids') if isinstance(publish_scope.get('city_ids'), list) else []
        mm_form = publish_scope.get('education_form_ids') if isinstance(publish_scope.get('education_form_ids'), list) else []
        mm_spec = publish_scope.get('speciality_ids') if isinstance(publish_scope.get('speciality_ids'), list) else []
        mm_year = publish_scope.get('admission_year_ids') if isinstance(publish_scope.get('admission_year_ids'), list) else []
        mm_courses = publish_scope.get('courses') if isinstance(publish_scope.get('courses'), list) else []
        mm_class = publish_scope.get('school_class_ids') if isinstance(publish_scope.get('school_class_ids'), list) else []
        if any([mm_city, mm_form, mm_spec, mm_year, mm_courses, mm_class]):
            rules = [{
                'city_ids': mm_city,
                'education_form_ids': mm_form,
                'speciality_ids': mm_spec,
                'admission_year_ids': mm_year,
                'courses': mm_courses,
                'school_class_ids': mm_class,
            }]
    if isinstance(rules, list) and len(rules) > 0:
        try:
            created_ids = []
            for r in rules:
                inst_ids = r.get('institution_type_ids') or [None]
                edu_forms = r.get('education_form_ids') or [None]
                specs = r.get('speciality_ids') or [None]
                cities = r.get('city_ids') or [None]
                years = r.get('admission_year_ids') or [None]
                courses = r.get('courses') if isinstance(r.get('courses'), list) else ([r.get('course')] if r.get('course') is not None else [None])
                classes = r.get('school_class_ids') if isinstance(r.get('school_class_ids'), list) else [None]
                for ef in edu_forms:
                    for sp in specs:
                        for ct in cities:
                            for yr in years:
                                for crs in courses:
                                    for scid in classes:
                                        # derive audience
                                        local_aud = None
                                        if r.get('publish_for_all'):
                                            local_aud = 'all'
                                        elif ct:
                                            local_aud = 'city'
                                        elif crs is not None:
                                            local_aud = 'course'
                                        art = Article(
                                            title=title,
                                            content=content,
                                            is_published=is_published,
                                            is_for_staff=is_for_staff,
                                            is_actual=is_actual,
                                            tag=None,
                                            base_class=None,
                                            audience=local_aud,
                                            audience_city_id=(ct if local_aud == 'city' else None),
                                            audience_course=(crs if local_aud == 'course' else None),
                                            audience_admission_year_id=(yr if local_aud not in ('all','city') else None)
                                        )
                                        # optional fields
                                        art.education_form_id = ef
                                        art.speciality_id = sp
                                        edu_mode = r.get('education_mode')
                                        if isinstance(edu_mode, str) and edu_mode in ru_mode_map:
                                            art.education_mode = ru_mode_map[edu_mode]
                                        else:
                                            art.education_mode = edu_mode
                                        # school base class if provided
                                        if scid:
                                            try:
                                                sc = SchoolClass.query.get(scid)
                                                if sc and sc.name and str(sc.name).isdigit():
                                                    art.base_class = int(sc.name)
                                            except Exception:
                                                pass

                                        db.session.add(art)
                                        db.session.flush()
                                        db.session.add(ArticleAuthor(article_id=art.id, user_id=user.id))
                                        for category_id in category_ids:
                                            category = Category.query.get(category_id)
                                            if category:
                                                db.session.add(ArticleCategory(article_id=art.id, category_id=category_id))
                                        created_ids.append(art.id)
            db.session.commit()
            return jsonify({'message': f'Created {len(created_ids)} articles', 'ids': created_ids}), 201
        except Exception:
            db.session.rollback()
            return jsonify({'error': 'Failed to create articles from rules'}), 500
    # Derive audience per diagram: 'all' → hide others; else if city → 'city' and hide other audience fields; else if course → 'course'
    derived_audience = None
    if publish_scope.get('publish_for_all'):
        derived_audience = 'all'
    elif publish_scope.get('city_id'):
        derived_audience = 'city'
    elif publish_scope.get('course'):
        derived_audience = 'course'

    article = Article(
        title=title,
        content=content,
        is_published=is_published,
        is_for_staff=is_for_staff,
        is_actual=is_actual,
        tag=(incoming_tag if incoming_tag in ('study','group') else None),
        base_class=None,
        audience=derived_audience,
        audience_city_id=(publish_scope.get('city_id') if derived_audience == 'city' else None),
        audience_course=(publish_scope.get('course') if derived_audience == 'course' else None),
        audience_admission_year_id=(publish_scope.get('admission_year_id') if derived_audience not in ('all','city') else None)
    )
    # optional multi-course + mode + speciality
    courses = publish_scope.get('courses')
    if isinstance(courses, list):
        try:
            article.audience_courses = json.dumps(courses)
        except Exception:
            article.audience_courses = None
    # Allow RU labels
    edu_mode = publish_scope.get('education_mode')
    if isinstance(edu_mode, str) and edu_mode in ru_mode_map:
        article.education_mode = ru_mode_map[edu_mode]
    else:
        article.education_mode = edu_mode
    # Core: institution type via speciality, education_form_id, speciality_id
    article.education_form_id = publish_scope.get('education_form_id')
    article.speciality_id = publish_scope.get('speciality_id')

    # School case: set base_class by selected class (or explicit base_class)
    # Accept either publish_scope.school_class_id or publish_scope.base_class (9/11)
    base_class = None
    sc_id = publish_scope.get('school_class_id')
    if sc_id:
        sc = SchoolClass.query.get(sc_id)
        try:
            base_class = int(sc.name) if sc and sc.name and str(sc.name).isdigit() else None
        except Exception:
            base_class = None
    if base_class is None and publish_scope.get('base_class'):
        try:
            base_class = int(publish_scope.get('base_class'))
        except Exception:
            base_class = None
    article.base_class = base_class
    
    try:
        db.session.add(article)
        db.session.flush()  # Get the article ID
        
        # Add author
        author = ArticleAuthor(article_id=article.id, user_id=user.id)
        db.session.add(author)
        
        # Add categories
        for category_id in category_ids:
            category = Category.query.get(category_id)
            if category:
                article_category = ArticleCategory(article_id=article.id, category_id=category_id)
                db.session.add(article_category)
        
        db.session.commit()
        
        return jsonify({
            'id': article.id,
            'title': article.title,
            'message': 'Article created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create article'}), 500

@articles_bp.route('/<int:article_id>', methods=['PUT'])
@jwt_required()
def update_article(article_id):
    """Update an existing article"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    article = Article.query.get_or_404(article_id)
    
    # Check if user is author or has admin/editor role
    is_author = any(author.user_id == user.id for author in article.authors)
    is_admin_or_editor = user.role.name in ['Администратор', 'Редактор']
    
    if not is_author and not is_admin_or_editor:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update fields if provided
    if 'title' in data:
        title = data['title'].strip()
        if len(title) < 3:
            return jsonify({'error': 'Title must be at least 3 characters long'}), 400
        article.title = title
    
    if 'content' in data:
        article.content = data['content']
    
    if 'is_published' in data:
        article.is_published = data['is_published']
    
    if 'is_for_staff' in data:
        article.is_for_staff = data['is_for_staff']
    
    if 'is_actual' in data:
        article.is_actual = data['is_actual']
    if 'publish_scope' in data and isinstance(data['publish_scope'], dict):
        ps = data['publish_scope']
        # Cleaned scope: publish_for_all OR targeted by form/speciality (optional city/course/year)
        article.tag = None
        article.base_class = None
        # audience per diagram
        if ps.get('publish_for_all'):
            article.audience = 'all'
            article.audience_city_id = None
            article.audience_course = None
            article.audience_admission_year_id = None
        elif ps.get('city_id'):
            article.audience = 'city'
            article.audience_city_id = ps.get('city_id')
            article.audience_course = None
        elif ps.get('course'):
            article.audience = 'course'
            article.audience_course = ps.get('course')
            article.audience_city_id = None
        else:
            article.audience = None
        article.education_form_id = ps.get('education_form_id', article.education_form_id)
        article.speciality_id = ps.get('speciality_id', article.speciality_id)
        article.audience_admission_year_id = ps.get('admission_year_id', article.audience_admission_year_id)
        # optional fields
        import json
        courses = ps.get('courses')
        if isinstance(courses, list):
            try:
                article.audience_courses = json.dumps(courses)
            except Exception:
                pass
        if 'education_mode' in ps:
            ru_mode_map = {
                'Очное': 'full_time',
                'Заочное': 'distance',
                'Очно-заочное': 'mixed'
            }
            val = ps.get('education_mode')
            article.education_mode = ru_mode_map.get(val, val)
        # School base_class
        base_class = None
        sc_id = ps.get('school_class_id')
        if sc_id:
            sc = SchoolClass.query.get(sc_id)
            try:
                base_class = int(sc.name) if sc and sc.name and str(sc.name).isdigit() else None
            except Exception:
                base_class = None
        if base_class is None and ps.get('base_class'):
            try:
                base_class = int(ps.get('base_class'))
            except Exception:
                base_class = None
        if base_class is not None:
            article.base_class = base_class
    
    if 'category_ids' in data:
        # Remove existing categories
        ArticleCategory.query.filter_by(article_id=article.id).delete()
        
        # Add new categories
        for category_id in data['category_ids']:
            category = Category.query.get(category_id)
            if category:
                article_category = ArticleCategory(article_id=article.id, category_id=category_id)
                db.session.add(article_category)
    
    article.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        
        return jsonify({
            'id': article.id,
            'title': article.title,
            'message': 'Article updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update article'}), 500

@articles_bp.route('/<int:article_id>', methods=['DELETE'])
@jwt_required()
def delete_article(article_id):
    """Delete an article"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    article = Article.query.get_or_404(article_id)
    
    # Check if user is author or has admin role (avoid loading relationship)
    is_author = ArticleAuthor.query.filter_by(article_id=article.id, user_id=user.id).first() is not None
    is_admin = user.role.name == 'Администратор'
    
    if not is_author and not is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        # Clean up related rows to avoid FK constraint errors on delete
        ArticleCategory.query.filter_by(article_id=article.id).delete(synchronize_session=False)
        ArticleMediaLink.query.filter_by(article_id=article.id).delete(synchronize_session=False)
        ArticleAuthor.query.filter_by(article_id=article.id).delete(synchronize_session=False)
        ArticleReaction.query.filter_by(article_id=article.id).delete(synchronize_session=False)
        ArticleView.query.filter_by(article_id=article.id).delete(synchronize_session=False)

        db.session.delete(article)
        db.session.commit()
        
        return jsonify({'message': 'Article deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete article', 'details': str(e)}), 500

@articles_bp.route('/<int:article_id>/publish', methods=['POST'])
@jwt_required()
def publish_article(article_id):
    """Publish an article"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    article = Article.query.get_or_404(article_id)
    
    # Check if user is author or has admin/editor role (avoid loading relationship)
    is_author = ArticleAuthor.query.filter_by(article_id=article.id, user_id=user.id).first() is not None
    is_admin_or_editor = user.role.name in ['Администратор', 'Редактор']
    
    if not is_author and not is_admin_or_editor:
        return jsonify({'error': 'Unauthorized'}), 403
    
    article.is_published = True
    article.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        
        return jsonify({
            'id': article.id,
            'title': article.title,
            'message': 'Article published successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to publish article'}), 500


@articles_bp.route('/import/weeek', methods=['POST'])
@jwt_required()
def import_from_weeek():
    """Import articles from Weeek share link using provided API key.
    Request JSON: { url: string, api_key?: string }
    Creates draft articles with tag 'imported'.
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json(silent=True) or {}
    share_url = data.get('url')
    api_key = data.get('api_key') or request.headers.get('X-WEEEK-API-KEY')
    if not share_url or not api_key:
        return jsonify({'error': 'url and api_key are required'}), 400

    try:
        # Minimal fetch. In real Weeek API you would call their REST to list pages.
        # Here we GET the shared document as HTML and extract sections into articles.
        res = requests.get(share_url, timeout=15)
        if res.status_code >= 400:
            return jsonify({'error': 'Failed to fetch from Weeek', 'status': res.status_code}), 502
        html = res.text or ''

        # Naive split by <section ... id="..."> as separate articles
        import re as _re
        chunks = _re.split(r'<section[^>]*id="([^"]+)"[^>]*>', html)
        created_ids = []
        # chunks format: [before, id1, rest1, id2, rest2, ...]
        for i in range(1, len(chunks), 2):
            sec_id = chunks[i]
            sec_html = chunks[i+1] if (i+1) < len(chunks) else ''
            # Title from first h2/h1
            m = _re.search(r'<h[12][^>]*>(.*?)</h[12]>', sec_html, _re.IGNORECASE | _re.DOTALL)
            title = _re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else f'Imported {sec_id}'

            article = Article(
                title=title[:255] or 'Imported',
                content=sec_html,
                is_published=False,
                is_for_staff=False,
                is_actual=False,
                tag='imported',
                audience=None,
            )
            try:
                db.session.add(article)
                db.session.flush()
                db.session.add(ArticleAuthor(article_id=article.id, user_id=user.id))
                created_ids.append(article.id)
            except Exception:
                db.session.rollback()
        db.session.commit()
        return jsonify({ 'imported_count': len(created_ids), 'article_ids': created_ids }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Import failed'}), 500

@articles_bp.route('/<int:article_id>/unpublish', methods=['POST'])
@jwt_required()
def unpublish_article(article_id):
    """Unpublish an article"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    article = Article.query.get_or_404(article_id)
    
    # Check if user is author or has admin/editor role (avoid loading relationship)
    is_author = ArticleAuthor.query.filter_by(article_id=article.id, user_id=user.id).first() is not None
    is_admin_or_editor = user.role.name in ['Администратор', 'Редактор']
    
    if not is_author and not is_admin_or_editor:
        return jsonify({'error': 'Unauthorized'}), 403
    
    article.is_published = False
    article.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        
        return jsonify({
            'id': article.id,
            'title': article.title,
            'message': 'Article unpublished successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to unpublish article'}), 500

@articles_bp.route('/<int:article_id>/reactions', methods=['GET'])
def list_reactions(article_id):
    article = Article.query.get_or_404(article_id)
    reactions = ArticleReaction.query.filter_by(article_id=article.id).all()
    counts = {}
    for r in reactions:
        code = r.emoji.code if r.emoji else 'unknown'
        counts[code] = counts.get(code, 0) + 1
    return jsonify({'counts': counts}), 200

@articles_bp.route('/metrics/overview', methods=['GET'])
@jwt_required()
def metrics_overview():
    """Simple metrics for editors/admins: total articles, published, views sum.
    Only for roles: Администратор, Редактор.
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role.name not in ['Администратор', 'Редактор']:
        return jsonify({'error': 'Unauthorized'}), 403
    total = Article.query.count()
    published = Article.query.filter_by(is_published=True).count()
    views = db.session.execute(db.text("SELECT COALESCE(SUM(views_count),0) FROM articles")).scalar() or 0
    return jsonify({'total_articles': total, 'published_articles': published, 'total_views': int(views)}), 200

@articles_bp.route('/<int:article_id>/reactions', methods=['POST'])
def add_reaction(article_id):
    article = Article.query.get_or_404(article_id)
    data = request.get_json() or {}
    code = (data.get('emoji_code') or '').strip()
    if not code:
        return jsonify({'error': 'emoji_code is required'}), 400
    emoji = ReactionEmoji.query.filter_by(code=code).first()
    if not emoji:
        emoji = ReactionEmoji(code=code, emoji=code)
        db.session.add(emoji)
        db.session.flush()
    reaction = ArticleReaction(article_id=article.id, emoji_id=emoji.id)
    db.session.add(reaction)
    try:
        db.session.commit()
        return jsonify({'message': 'Reaction added'}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to add reaction'}), 500

@articles_bp.route('/<int:article_id>/publish-for-all', methods=['POST'])
@jwt_required()
def publish_for_all(article_id):
    """Set article audience to 'all' (publish for everyone)."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    article = Article.query.get_or_404(article_id)
    is_author = any(author.user_id == user.id for author in article.authors)
    is_admin_or_editor = user.role.name in ['Администратор', 'Редактор']
    if not is_author and not is_admin_or_editor:
        return jsonify({'error': 'Unauthorized'}), 403
    article.audience = 'all'
    article.audience_city_id = None
    article.audience_course = None
    article.audience_admission_year_id = None
    try:
        db.session.commit()
        return jsonify({'message': 'Audience set to all'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to set audience'}), 500

@articles_bp.route('/student-feed', methods=['GET'])
def student_feed():
    """Return feed tailored for a student group context.
    Query: group_id (required), course (optional), page/per_page
    Includes articles with audience='all' or targeted entries matching student's context.
    """
    from sqlalchemy import and_
    group_id = request.args.get('group_id', type=int)
    course = request.args.get('course', type=int)
    # Optional arrays from request (student context)
    def _to_ints(name: str):
        try:
            return [int(x) for x in request.args.getlist(name) if str(x).isdigit()]
        except Exception:
            return []
    req_city_ids = _to_ints('city_ids')
    req_courses = _to_ints('courses')
    req_spec_ids = _to_ints('speciality_ids')
    req_form_ids = _to_ints('education_form_ids')
    req_year_ids = _to_ints('admission_year_ids')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    if not group_id:
        return jsonify({'error': 'group_id is required'}), 400
    group = Group.query.get_or_404(group_id)

    # Resolve context
    speciality_id = getattr(group, 'speciality_id', None)
    admission_year_id = getattr(group, 'admission_year_id', None)
    city_id = getattr(group, 'city_id', None)
    base_class = getattr(group, 'base_class', None)
    edu_mode = None
    education_form_id = getattr(group, 'education_form_id', None)
    student_inst_type_id = getattr(group, 'institution_type_id', None)

    query = Article.query.filter(Article.is_published.is_(True))

    # Targeting logic per diagram:
    # - Always include audience 'all'
    # - If city present, include city targeted
    # - If course provided, include course targeted
    # - School case: if group has school_class, allow class-only filtering via additional constraints below
    conds = [Article.audience == 'all']
    if city_id:
        conds.append(and_(Article.audience == 'city', Article.audience_city_id == city_id))
    if course:
        conds.append(and_(Article.audience == 'course', Article.audience_course == course))
    query = query.filter(or_(*conds))

    # Additional constraints: if article specified a field, it must match; None means general and should pass
    if base_class is not None:
        query = query.filter(or_(Article.base_class.is_(None), Article.base_class == base_class))
    if speciality_id is not None:
        query = query.filter(or_(Article.speciality_id.is_(None), Article.speciality_id == speciality_id))
    if education_form_id is not None:
        query = query.filter(or_(Article.education_form_id.is_(None), Article.education_form_id == education_form_id))
    if admission_year_id is not None:
        query = query.filter(or_(Article.audience_admission_year_id.is_(None), Article.audience_admission_year_id == admission_year_id))
    if edu_mode is not None:
        query = query.filter(or_(Article.education_mode.is_(None), Article.education_mode == edu_mode))

    # Institution constraint via linked groups (if present):
    # If article has linked group categories, at least one must match student's institution type.
    if student_inst_type_id is not None:
        from sqlalchemy import exists, select
        AC = ArticleCategory
        Cat = Category
        G = Group
        query = query.filter(
            or_(
                ~exists(select(1).where(AC.article_id == Article.id)),
                exists(
                    select(1)
                    .select_from(AC)
                    .join(Cat, AC.category_id == Cat.id)
                    .join(G, Cat.group_id == G.id)
                    .where(AC.article_id == Article.id, G.institution_type_id == student_inst_type_id)
                )
            )
        )

    # Fetch candidates and apply array-based student context matching
    query = query.order_by(desc(Article.created_at))
    candidates = query.all()

    student_city_ids = req_city_ids or ([city_id] if city_id else [])
    student_courses = req_courses or ([course] if course else [])
    student_spec_ids = req_spec_ids or ([speciality_id] if speciality_id else [])
    student_form_ids = req_form_ids or ([education_form_id] if education_form_id else [])
    student_year_ids = req_year_ids or ([admission_year_id] if admission_year_id else [])
    student_base_classes = ([base_class] if base_class is not None else [])

    def _matches(a: Article) -> bool:
        # audience checks were already applied for city/course. Here enforce arrays if present in article
        if a.base_class is not None and student_base_classes and a.base_class not in student_base_classes:
            return False
        if a.speciality_id is not None and student_spec_ids and a.speciality_id not in student_spec_ids:
            return False
        if a.education_form_id is not None and student_form_ids and a.education_form_id not in student_form_ids:
            return False
        if a.audience_admission_year_id is not None and student_year_ids and a.audience_admission_year_id not in student_year_ids:
            return False
        # audience_courses JSON array
        try:
            import json as _json
            arr = _json.loads(a.audience_courses or 'null')
            if isinstance(arr, list) and student_courses:
                if not any((isinstance(x, int) and x in student_courses) for x in arr):
                    return False
        except Exception:
            pass
        return True

    filtered = [a for a in candidates if _matches(a)]

    # manual pagination
    total = len(filtered)
    start = (page - 1) * per_page
    end = start + per_page
    page_items = filtered[start:end]

    items = []
    for article in page_items:
        categories = []
        for ac in article.categories:
            c = ac.category
            categories.append({'id': c.id})
        authors = [{'id': a.user.id, 'full_name': a.user.full_name, 'email': a.user.email} for a in article.authors]
        items.append({
            'id': article.id,
            'title': article.title,
            'content': article.content,
            'created_at': article.created_at.isoformat(),
            'updated_at': article.updated_at.isoformat(),
            'is_published': article.is_published,
            'categories': categories,
            'authors': authors,
        })
    return jsonify({
        'articles': items,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page,
            'has_next': end < total,
            'has_prev': start > 0,
        }
    }), 200

@articles_bp.route('/bulk', methods=['POST'])
@jwt_required()
def create_articles_bulk():
    """Create multiple articles across selected dimensions.
    Expected payload:
    {
      "base_article": { title, content, is_published, is_for_staff, is_actual, category_ids: [], publish_scope: { tag, baseClass, audience, city_id, course, admission_year_id, courses, education_mode, speciality_id } },
      "bulk": {
        "all_cities": bool,
        "all_specialities": bool,
        "all_education_modes": bool,
        "all_groups": bool,
        "audience_all": bool
      }
    }
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    payload = request.get_json() or {}
    base_article = payload.get('base_article') or {}
    bulk = payload.get('bulk') or {}

    # Validate minimal fields
    title = (base_article.get('title') or '').strip()
    content = base_article.get('content')
    if len(title) < 3 or not content:
        return jsonify({'error': 'Invalid title or content'}), 400

    category_ids = base_article.get('category_ids') or []
    publish_scope = base_article.get('publish_scope') or {}

    # Resolve lists per dimension
    cities = [publish_scope.get('city_id')] if publish_scope.get('city_id') else []
    if bulk.get('all_cities'):
        cities = [c.id for c in City.query.all()]

    specialities = [publish_scope.get('speciality_id')] if publish_scope.get('speciality_id') else []
    if bulk.get('all_specialities'):
        specialities = [s.id for s in Speciality.query.all()]

    education_modes = [publish_scope.get('education_mode')] if publish_scope.get('education_mode') else []
    if bulk.get('all_education_modes'):
        education_modes = ['full_time', 'distance']

    groups = []
    # categories carry group ids implicitly; allow explicit bulk on all groups
    if bulk.get('all_groups'):
        groups = [g.id for g in Group.query.all()]

    # Fallbacks to create at least one when list empty and not audience_all
    if bulk.get('audience_all'):
        # Single article targeting everyone
        cities = [None]
        specialities = [None]
        education_modes = [None]
        groups = [None]
    else:
        if not cities:
            cities = [publish_scope.get('city_id')] if publish_scope.get('city_id') else [None]
        if not specialities:
            specialities = [publish_scope.get('speciality_id')] if publish_scope.get('speciality_id') else [None]
        if not education_modes:
            education_modes = [publish_scope.get('education_mode')] if publish_scope.get('education_mode') else [None]
        if not groups:
            groups = [None]

    created = 0
    try:
        for city_id in cities:
            for spec_id in specialities:
                for mode in education_modes:
                    for group_id in groups:
                        art = Article(
                            title=title,
                            content=content,
                            is_published=bool(base_article.get('is_published', False)),
                            is_for_staff=bool(base_article.get('is_for_staff', False)),
                            is_actual=bool(base_article.get('is_actual', True)),
                            tag=publish_scope.get('tag'),
                            base_class=publish_scope.get('baseClass'),
                            audience='all' if bulk.get('audience_all') else (publish_scope.get('audience') or 'all'),
                            audience_city_id=city_id,
                            audience_course=publish_scope.get('course'),
                            audience_admission_year_id=publish_scope.get('admission_year_id'),
                        )
                        art.education_mode = mode
                        art.speciality_id = spec_id
                        db.session.add(art)
                        db.session.flush()
                        # author
                        db.session.add(ArticleAuthor(article_id=art.id, user_id=user.id))
                        # attach categories
                        for cid in category_ids:
                            db.session.add(ArticleCategory(article_id=art.id, category_id=cid))
                        # attach group category if explicit
                        if group_id:
                            db.session.add(ArticleCategory(article_id=art.id, category_id=group_id))
                        created += 1
        db.session.commit()
        return jsonify({'message': f'Created {created} articles'}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Bulk create failed'}), 500
