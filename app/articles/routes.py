from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.articles import articles_bp
from app.models import Article, Category, TopCategory, Subcategory, Group, User, ArticleAuthor, ArticleCategory, ArticleMedia, ArticleMediaLink
from app import db
from datetime import datetime
import re

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
        query = query.filter(Article.title.ilike(f'%{search}%'))
    
    # Order by creation date (newest first)
    query = query.order_by(Article.created_at.desc())
    
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
        'media': media
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
    
    # Validate title
    if len(title) < 3:
        return jsonify({'error': 'Title must be at least 3 characters long'}), 400
    
    # Create article
    article = Article(
        title=title,
        content=content,
        is_published=is_published,
        is_for_staff=is_for_staff,
        is_actual=is_actual
    )
    
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
    
    # Check if user is author or has admin role
    is_author = any(author.user_id == user.id for author in article.authors)
    is_admin = user.role.name == 'Администратор'
    
    if not is_author and not is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        db.session.delete(article)
        db.session.commit()
        
        return jsonify({'message': 'Article deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete article'}), 500

@articles_bp.route('/<int:article_id>/publish', methods=['POST'])
@jwt_required()
def publish_article(article_id):
    """Publish an article"""
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

@articles_bp.route('/<int:article_id>/unpublish', methods=['POST'])
@jwt_required()
def unpublish_article(article_id):
    """Unpublish an article"""
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
