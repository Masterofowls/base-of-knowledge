from flask import request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.media import media_bp
from app.models import ArticleMedia, ArticleMediaLink, Article, User
from app import db
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import io

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'pdf', 'doc', 'docx', 'txt', 'mp4', 'avi', 'mov'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@media_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_media():
    """Upload media file"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    try:
        # Read file data
        file_data = file.read()
        filename = secure_filename(file.filename)
        
        # Determine media type
        file_extension = filename.rsplit('.', 1)[1].lower()
        if file_extension in ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']:
            media_type = 'image'
        elif file_extension in ['mp4', 'avi', 'mov']:
            media_type = 'video'
        elif file_extension in ['pdf', 'doc', 'docx', 'txt']:
            media_type = 'file'
        else:
            media_type = 'file'
        
        # Create media record
        media = ArticleMedia(
            media_type=media_type,
            data=file_data,
            file_name=filename,
            mime_type=file.content_type,
            caption=request.form.get('caption', '')
        )
        
        db.session.add(media)
        db.session.commit()
        
        return jsonify({
            'id': media.id,
            'file_name': media.file_name,
            'media_type': media.media_type,
            'mime_type': media.mime_type,
            'caption': media.caption,
            'message': 'File uploaded successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to upload file: {str(e)}'}), 500

@media_bp.route('/<int:media_id>', methods=['GET'])
def get_media(media_id):
    """Get media file"""
    media = ArticleMedia.query.get_or_404(media_id)
    
    # Create file-like object from binary data
    file_obj = io.BytesIO(media.data)
    
    return send_file(
        file_obj,
        mimetype=media.mime_type,
        as_attachment=False,
        download_name=media.file_name
    )

@media_bp.route('/<int:media_id>', methods=['DELETE'])
@jwt_required()
def delete_media(media_id):
    """Delete media file"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    media = ArticleMedia.query.get_or_404(media_id)
    
    # Check if user has permission to delete this media
    # (Only authors of articles that use this media or admins/editors)
    is_author = False
    is_admin_or_editor = user.role.name in ['Администратор', 'Редактор']
    
    for link in media.article_links:
        article = link.article
        if any(author.user_id == user.id for author in article.authors):
            is_author = True
            break
    
    if not is_author and not is_admin_or_editor:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        # Remove all article links first
        ArticleMediaLink.query.filter_by(media_id=media_id).delete()
        
        # Delete media
        db.session.delete(media)
        db.session.commit()
        
        return jsonify({'message': 'Media deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete media'}), 500

@media_bp.route('/article/<int:article_id>/media', methods=['GET'])
def get_article_media(article_id):
    """Get all media for a specific article"""
    article = Article.query.get_or_404(article_id)
    
    media_list = []
    for media_link in article.media_links:
        media_data = {
            'id': media_link.media.id,
            'media_type': media_link.media.media_type,
            'file_name': media_link.media.file_name,
            'mime_type': media_link.media.mime_type,
            'caption': media_link.media.caption,
            'position': media_link.position,
            'created_at': media_link.media.created_at.isoformat()
        }
        media_list.append(media_data)
    
    # Sort by position
    media_list.sort(key=lambda x: x['position'] or 0)
    
    return jsonify(media_list), 200

@media_bp.route('/article/<int:article_id>/media', methods=['POST'])
@jwt_required()
def add_media_to_article(article_id):
    """Add media to an article"""
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
    
    if not data or not data.get('media_id'):
        return jsonify({'error': 'Media ID is required'}), 400
    
    media_id = data['media_id']
    position = data.get('position', 0)
    
    # Check if media exists
    media = ArticleMedia.query.get(media_id)
    if not media:
        return jsonify({'error': 'Media not found'}), 404
    
    # Check if media is already linked to this article
    existing_link = ArticleMediaLink.query.filter_by(
        article_id=article_id,
        media_id=media_id
    ).first()
    
    if existing_link:
        return jsonify({'error': 'Media already linked to this article'}), 409
    
    # Create link
    media_link = ArticleMediaLink(
        article_id=article_id,
        media_id=media_id,
        position=position
    )
    
    try:
        db.session.add(media_link)
        db.session.commit()
        
        return jsonify({
            'id': media_link.media_id,
            'position': media_link.position,
            'message': 'Media added to article successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add media to article'}), 500

@media_bp.route('/article/<int:article_id>/media/<int:media_id>', methods=['DELETE'])
@jwt_required()
def remove_media_from_article(article_id, media_id):
    """Remove media from an article"""
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
    
    # Find the link
    media_link = ArticleMediaLink.query.filter_by(
        article_id=article_id,
        media_id=media_id
    ).first()
    
    if not media_link:
        return jsonify({'error': 'Media not linked to this article'}), 404
    
    try:
        db.session.delete(media_link)
        db.session.commit()
        
        return jsonify({'message': 'Media removed from article successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to remove media from article'}), 500

@media_bp.route('/article/<int:article_id>/media/<int:media_id>', methods=['PUT'])
@jwt_required()
def update_media_position(article_id, media_id):
    """Update media position in article"""
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
    
    if not data or 'position' not in data:
        return jsonify({'error': 'Position is required'}), 400
    
    position = data['position']
    
    # Find the link
    media_link = ArticleMediaLink.query.filter_by(
        article_id=article_id,
        media_id=media_id
    ).first()
    
    if not media_link:
        return jsonify({'error': 'Media not linked to this article'}), 404
    
    media_link.position = position
    
    try:
        db.session.commit()
        
        return jsonify({
            'id': media_link.media_id,
            'position': media_link.position,
            'message': 'Media position updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update media position'}), 500
