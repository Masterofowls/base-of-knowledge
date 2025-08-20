from flask import request, jsonify, send_file, redirect, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.media import media_bp
from app.models import ArticleMedia, ArticleMediaLink, Article, User
from app import db
import os
import mimetypes
from werkzeug.utils import secure_filename
from datetime import datetime
import io

ALLOWED_EXTENSIONS = {
    # images
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp',
    # documents
    'pdf', 'doc', 'docx', 'txt', 'md', 'markdown', 'rtf', 'fb2', 'odt', 'ods', 'ppt', 'pptx', 'xls', 'xlsx',
    # videos
    'mp4', 'avi', 'mov', 'mkv', 'webm', 'm4v', '3gp'
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def guess_mime(filename: str, fallback: str = 'application/octet-stream') -> str:
    # Extend default types
    mimetypes.add_type('text/markdown', '.md')
    mimetypes.add_type('application/x-fictionbook+xml', '.fb2')
    mimetypes.add_type('application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx')
    mimetypes.add_type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx')
    mimetypes.add_type('application/vnd.openxmlformats-officedocument.presentationml.presentation', '.pptx')
    # common video types
    mimetypes.add_type('video/mp4', '.mp4')
    mimetypes.add_type('video/x-matroska', '.mkv')
    mimetypes.add_type('video/webm', '.webm')
    mimetypes.add_type('video/quicktime', '.mov')
    mimetypes.add_type('video/x-msvideo', '.avi')
    mimetypes.add_type('video/x-m4v', '.m4v')
    mimetypes.add_type('video/3gpp', '.3gp')
    mime, _ = mimetypes.guess_type(filename)
    return mime or fallback

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
        elif file_extension in ['mp4', 'avi', 'mov', 'mkv', 'webm', 'm4v', '3gp']:
            media_type = 'video'
        elif file_extension in ['pdf', 'doc', 'docx', 'txt', 'md', 'markdown', 'rtf', 'fb2', 'odt', 'ods', 'ppt', 'pptx', 'xls', 'xlsx']:
            media_type = 'file'
        else:
            media_type = 'file'
        
        # Create media record
        media = ArticleMedia(
            media_type=media_type,
            data=file_data,
            file_name=filename,
            mime_type=(file.content_type or guess_mime(filename)),
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
    """Get media file with support for inline display and HTTP Range for video/audio/pdf.
    For link-type media, redirect to the stored URL.
    """
    media = ArticleMedia.query.get_or_404(media_id)
    # Handle link redirects
    if media.media_type == 'link' and media.file_name:
        return redirect(media.file_name, code=302)

    data = media.data or b''
    mime = media.mime_type or guess_mime(media.file_name or '')

    # Handle Range requests for streaming
    range_header = request.headers.get('Range')
    if range_header and len(data) > 0:
        try:
            # Example: Range: bytes=START-END
            units, rng = range_header.split('=')
            if units.strip() != 'bytes':
                raise ValueError('unsupported range unit')
            start_s, end_s = (rng.split('-') + [''])[:2]
            start = int(start_s) if start_s else 0
            end = int(end_s) if end_s else len(data) - 1
            start = max(0, start)
            end = min(len(data) - 1, end)
            if start > end:
                start, end = 0, len(data) - 1
            chunk = data[start:end + 1]
            rv = Response(chunk, 206, mimetype=mime, direct_passthrough=True)
            rv.headers.add('Content-Range', f'bytes {start}-{end}/{len(data)}')
            rv.headers.add('Accept-Ranges', 'bytes')
            rv.headers.add('Content-Length', str(len(chunk)))
            rv.headers.add('Content-Disposition', f'inline; filename="{media.file_name}"')
            return rv
        except Exception:
            # Fallback to full content
            pass

    # Full content
    file_obj = io.BytesIO(data)
    rv = send_file(
        file_obj,
        mimetype=mime,
        as_attachment=False,
        download_name=media.file_name
    )
    # hint to clients that range is supported
    rv.headers.add('Accept-Ranges', 'bytes')
    return rv

@media_bp.route('/create-link', methods=['POST'])
@jwt_required()
def create_link_media():
    """Register an external link (e.g., YouTube/VK video) as media of type 'link'.
    Body: { url: string, caption?: string }
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.get_json() or {}
    url = (data.get('url') or '').strip()
    if not url:
        return jsonify({'error': 'url is required'}), 400
    try:
        # store empty payload for link; keep url in file_name for reference
        media = ArticleMedia(
            media_type='link',
            data=b'',
            file_name=url,
            mime_type='text/uri-list',
            caption=data.get('caption', '')
        )
        db.session.add(media)
        db.session.commit()
        return jsonify({ 'id': media.id, 'url': url, 'media_type': 'link' }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create link'}), 500

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
