from app import db
from datetime import datetime, timedelta
from sqlalchemy.dialects.mysql import LONGBLOB, LONGTEXT
from sqlalchemy import Text, LargeBinary

class InstitutionType(db.Model):
    __tablename__ = 'institution_types'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    
    # Relationships
    top_categories = db.relationship('TopCategory', backref='institution_type', lazy=True)
    education_forms = db.relationship('EducationForm', backref='institution_type', lazy=True)
    specialities = db.relationship('Speciality', backref='institution_type', lazy=True)
    school_classes = db.relationship('SchoolClass', backref='institution_type', lazy=True)
    admission_years = db.relationship('AdmissionYear', backref='institution_type', lazy=True)
    groups = db.relationship('Group', backref='institution_type', lazy=True)

class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    
    # Relationships
    users = db.relationship('User', backref='role', lazy=True)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.Text, nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    full_name = db.Column(db.String(100))
    
    # Relationships
    articles_authored = db.relationship('ArticleAuthor', backref='user', lazy=True)
    article_reactions = db.relationship('ArticleReaction', backref='user', lazy=True)

class TopCategory(db.Model):
    __tablename__ = 'top_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    institution_type_id = db.Column(db.Integer, db.ForeignKey('institution_types.id'))
    
    # Relationships
    subcategories = db.relationship('Subcategory', backref='top_category', lazy=True, cascade='all, delete-orphan')
    categories = db.relationship('Category', backref='top_category', lazy=True)

class Subcategory(db.Model):
    __tablename__ = 'subcategories'
    
    id = db.Column(db.Integer, primary_key=True)
    top_category_id = db.Column(db.Integer, db.ForeignKey('top_categories.id'), nullable=False)
    slug = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    
    # Relationships
    categories = db.relationship('Category', backref='subcategory', lazy=True)
    
    __table_args__ = (db.UniqueConstraint('top_category_id', 'slug'),)

class EducationForm(db.Model):
    __tablename__ = 'education_forms'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    institution_type_id = db.Column(db.Integer, db.ForeignKey('institution_types.id'))
    
    # Relationships
    groups = db.relationship('Group', backref='education_form', lazy=True)
    
    __table_args__ = (db.UniqueConstraint('institution_type_id', 'name'),)

class Speciality(db.Model):
    __tablename__ = 'specialities'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    institution_type_id = db.Column(db.Integer, db.ForeignKey('institution_types.id'))
    
    # Relationships
    groups = db.relationship('Group', backref='speciality', lazy=True)
    
    __table_args__ = (db.UniqueConstraint('institution_type_id', 'code'),)

class SchoolClass(db.Model):
    __tablename__ = 'school_classes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(10), nullable=False)
    institution_type_id = db.Column(db.Integer, db.ForeignKey('institution_types.id'), nullable=False)
    
    # Relationships
    groups = db.relationship('Group', backref='school_class', lazy=True)

class AdmissionYear(db.Model):
    __tablename__ = 'admission_years'
    
    id = db.Column(db.Integer, primary_key=True)
    year = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    institution_type_id = db.Column(db.Integer, db.ForeignKey('institution_types.id'))
    
    # Relationships
    groups = db.relationship('Group', backref='admission_year', lazy=True)
    
    __table_args__ = (db.UniqueConstraint('institution_type_id', 'year'),)

class City(db.Model):
    __tablename__ = 'cities'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    
    # Relationships
    groups = db.relationship('Group', backref='city', lazy=True)

class Group(db.Model):
    __tablename__ = 'groupss'
    
    id = db.Column(db.Integer, primary_key=True)
    display_name = db.Column(db.String(255), unique=True, nullable=False)
    speciality_id = db.Column(db.Integer, db.ForeignKey('specialities.id'), nullable=False)
    education_form_id = db.Column(db.Integer, db.ForeignKey('education_forms.id'), nullable=False)
    admission_year_id = db.Column(db.Integer, db.ForeignKey('admission_years.id'), nullable=False)
    school_class_id = db.Column(db.Integer, db.ForeignKey('school_classes.id'))
    city_id = db.Column(db.Integer, db.ForeignKey('cities.id'))
    institution_type_id = db.Column(db.Integer, db.ForeignKey('institution_types.id'), nullable=False)
    
    # Relationships
    categories = db.relationship('Category', backref='group', lazy=True)

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    top_category_id = db.Column(db.Integer, db.ForeignKey('top_categories.id'))
    subcategory_id = db.Column(db.Integer, db.ForeignKey('subcategories.id'))
    group_id = db.Column(db.Integer, db.ForeignKey('groupss.id'))
    
    # Relationships
    articles = db.relationship('ArticleCategory', backref='category', lazy=True)
    
    __table_args__ = (db.UniqueConstraint('top_category_id', 'subcategory_id', 'group_id'),)

class ArticleMedia(db.Model):
    __tablename__ = 'articles_media'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    # Explicitly name the PostgreSQL ENUM to satisfy PG requirement
    media_type = db.Column(
        db.Enum('image', 'video', 'file', 'link', name='article_media_type'),
        nullable=False,
    )
    data = db.Column(LargeBinary, nullable=False)
    file_name = db.Column(db.String(255))
    mime_type = db.Column(db.String(100))
    caption = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    article_links = db.relationship('ArticleMediaLink', backref='media', lazy=True)

class ReactionEmoji(db.Model):
    __tablename__ = 'reaction_emojis'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code = db.Column(db.String(32), unique=True, nullable=False)
    emoji = db.Column(db.String(16), nullable=False)
    
    # Relationships
    reactions = db.relationship('ArticleReaction', backref='emoji', lazy=True)

class Article(db.Model):
    __tablename__ = 'articles'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_published = db.Column(db.Boolean, default=False, nullable=False)
    is_for_staff = db.Column(db.Boolean, default=False, nullable=False)
    is_actual = db.Column(db.Boolean, default=False, nullable=False)
    archive_at = db.Column(db.DateTime)
    archived_at = db.Column(db.DateTime)
    # Metrics
    views_count = db.Column(db.Integer, default=0)
    # Publishing scope fields
    tag = db.Column(db.String(20))  # 'common' | 'important' | 'useful'
    base_class = db.Column(db.Integer)  # 9 or 11
    audience = db.Column(db.String(20))  # 'all' | 'city' | 'course'
    audience_city_id = db.Column(db.Integer, db.ForeignKey('cities.id'))
    audience_course = db.Column(db.Integer)  # 1-3
    audience_admission_year_id = db.Column(db.Integer, db.ForeignKey('admission_years.id'))
    audience_courses = db.Column(db.Text)  # JSON-encoded array of ints [1,2,3]
    education_mode = db.Column(db.String(20))  # 'full_time' | 'distance'
    education_form_id = db.Column(db.Integer, db.ForeignKey('education_forms.id'))
    speciality_id = db.Column(db.Integer, db.ForeignKey('specialities.id'))
    
    # Relationships
    authors = db.relationship('ArticleAuthor', backref='article', lazy=True)
    categories = db.relationship('ArticleCategory', backref='article', lazy=True)
    media_links = db.relationship('ArticleMediaLink', backref='article', lazy=True)
    reactions = db.relationship('ArticleReaction', backref='article', lazy=True)

class ArticleView(db.Model):
    __tablename__ = 'article_views'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    article_id = db.Column(db.Integer, db.ForeignKey('articles.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

class ArticleReaction(db.Model):
    __tablename__ = 'article_reactions'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    article_id = db.Column(db.Integer, db.ForeignKey('articles.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    emoji_id = db.Column(db.Integer, db.ForeignKey('reaction_emojis.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ArticleAuthor(db.Model):
    __tablename__ = 'article_authors'
    
    article_id = db.Column(db.Integer, db.ForeignKey('articles.id'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)

class ArticleCategory(db.Model):
    __tablename__ = 'article_categories'
    
    article_id = db.Column(db.Integer, db.ForeignKey('articles.id'), primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), primary_key=True)

class ArticleMediaLink(db.Model):
    __tablename__ = 'article_media_links'
    
    article_id = db.Column(db.Integer, db.ForeignKey('articles.id'), primary_key=True)
    media_id = db.Column(db.Integer, db.ForeignKey('articles_media.id'), primary_key=True)
    position = db.Column(db.Integer)


class AdminSession(db.Model):
    __tablename__ = 'admin_sessions'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    sid = db.Column(db.String(64), nullable=False, unique=True, index=True)
    user_agent = db.Column(db.String(255))
    ip_address = db.Column(db.String(64))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    revoked_at = db.Column(db.DateTime)

    def is_active(self) -> bool:
        return self.revoked_at is None


class EditLock(db.Model):
    __tablename__ = 'edit_locks'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    resource_type = db.Column(db.String(50), nullable=False)  # e.g., 'article'
    resource_id = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    acquired_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    heartbeat_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('resource_type', 'resource_id', name='uq_edit_lock_resource'),
    )

    def is_expired(self, ttl_seconds: int = 120) -> bool:
        return (datetime.utcnow() - (self.heartbeat_at or self.acquired_at)).total_seconds() > ttl_seconds
