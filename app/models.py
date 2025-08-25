from app import db
from datetime import datetime, timedelta
from sqlalchemy.dialects.mysql import LONGBLOB, LONGTEXT
from sqlalchemy import Text, LargeBinary, JSON

# Новые модели для иерархической структуры фильтров
class FilterTree(db.Model):
    """Корневая модель для дерева фильтров"""
    __tablename__ = 'filter_trees'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    institution_types = db.relationship('FilterInstitutionType', backref='filter_tree', lazy=True, cascade='all, delete-orphan')

class FilterInstitutionType(db.Model):
    """Тип учебного заведения (колледж, университет, школа)"""
    __tablename__ = 'filter_institution_types'

    id = db.Column(db.Integer, primary_key=True)
    filter_tree_id = db.Column(db.Integer, db.ForeignKey('filter_trees.id'), nullable=False)
    type_key = db.Column(db.String(50), nullable=False)  # 'college', 'university', 'school'
    display_name = db.Column(db.String(100), nullable=False)  # 'Колледж', 'Университет', 'Школа'
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)

    # Relationships
    general_filters = db.relationship('FilterGeneral', backref='institution_type', lazy=True, cascade='all, delete-orphan')
    cities = db.relationship('FilterCity', backref='institution_type', lazy=True, cascade='all, delete-orphan')
    study_programs = db.relationship('FilterStudyProgram', backref='institution_type', lazy=True, cascade='all, delete-orphan')

    __table_args__ = (db.UniqueConstraint('filter_tree_id', 'type_key'),)

class FilterGeneral(db.Model):
    """Общие фильтры для типа учреждения"""
    __tablename__ = 'filter_generals'

    id = db.Column(db.Integer, primary_key=True)
    institution_type_id = db.Column(db.Integer, db.ForeignKey('filter_institution_types.id'), nullable=False)
    filter_key = db.Column(db.String(50), nullable=False)  # 'general', 'city', 'study_info'
    display_name = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)

    # Relationships
    city_filters = db.relationship('FilterCity', backref='general_filter', lazy=True, cascade='all, delete-orphan')
    study_info_filters = db.relationship('FilterStudyProgram', backref='general_filter', lazy=True, cascade='all, delete-orphan')

class FilterCity(db.Model):
    """Города для фильтрации"""
    __tablename__ = 'filter_cities'

    id = db.Column(db.Integer, primary_key=True)
    institution_type_id = db.Column(db.Integer, db.ForeignKey('filter_institution_types.id'), nullable=False)
    general_filter_id = db.Column(db.Integer, db.ForeignKey('filter_generals.id'), nullable=False)
    city_key = db.Column(db.String(10), nullable=False)  # 'nsk', 'spb', 'msk', 'ekb', 'krd', 'rnd'
    display_name = db.Column(db.String(100), nullable=False)  # 'Новосибирск', 'Санкт-Петербург', etc.
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)

    # Relationships
    course_filters = db.relationship('FilterCourse', backref='city', lazy=True, cascade='all, delete-orphan')

    __table_args__ = (db.UniqueConstraint('institution_type_id', 'general_filter_id', 'city_key'),)

class FilterStudyProgram(db.Model):
    """Учебные программы/специальности"""
    __tablename__ = 'filter_study_programs'

    id = db.Column(db.Integer, primary_key=True)
    institution_type_id = db.Column(db.Integer, db.ForeignKey('filter_institution_types.id'), nullable=False)
    general_filter_id = db.Column(db.Integer, db.ForeignKey('filter_generals.id'), nullable=False)
    program_key = db.Column(db.String(50), nullable=False)  # 'programming', 'sys_adm', 'design', etc.
    display_name = db.Column(db.String(100), nullable=False)  # 'Программирование', 'Системное администрирование', etc.
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)

    # Relationships
    courses = db.relationship('FilterCourse', backref='study_program', lazy=True, cascade='all, delete-orphan')

    __table_args__ = (db.UniqueConstraint('institution_type_id', 'general_filter_id', 'program_key'),)

class FilterCourse(db.Model):
    """Курсы обучения"""
    __tablename__ = 'filter_courses'

    id = db.Column(db.Integer, primary_key=True)
    study_program_id = db.Column(db.Integer, db.ForeignKey('filter_study_programs.id'), nullable=False)
    city_id = db.Column(db.Integer, db.ForeignKey('filter_cities.id'), nullable=False)
    course_key = db.Column(db.String(20), nullable=False)  # '1 course', '2 course', '3 course', '4 course'
    display_name = db.Column(db.String(100), nullable=False)  # '1 курс', '2 курс', etc.
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)

    # Relationships
    education_forms = db.relationship('FilterEducationForm', backref='course', lazy=True, cascade='all, delete-orphan')

    __table_args__ = (db.UniqueConstraint('study_program_id', 'city_id', 'course_key'),)

class FilterEducationForm(db.Model):
    """Формы обучения"""
    __tablename__ = 'filter_education_forms'

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('filter_courses.id'), nullable=False)
    form_key = db.Column(db.String(20), nullable=False)  # 'full_time', 'remote', 'dist', 'blended'
    display_name = db.Column(db.String(100), nullable=False)  # 'Очная', 'Заочная', 'Дистанционная', 'Смешанная'
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)

    # Relationships
    city_instances = db.relationship('FilterCityInstance', backref='education_form', lazy=True, cascade='all, delete-orphan')

    __table_args__ = (db.UniqueConstraint('course_id', 'form_key'),)

class FilterCityInstance(db.Model):
    """Конкретные города для формы обучения"""
    __tablename__ = 'filter_city_instances'

    id = db.Column(db.Integer, primary_key=True)
    education_form_id = db.Column(db.Integer, db.ForeignKey('filter_education_forms.id'), nullable=False)
    city_key = db.Column(db.String(10), nullable=False)  # 'nsk', 'spb', 'msk', 'ekb', 'krd', 'rnd'
    display_name = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)

    # Relationships
    groups = db.relationship('FilterGroup', backref='city_instance', lazy=True, cascade='all, delete-orphan')

    __table_args__ = (db.UniqueConstraint('education_form_id', 'city_key'),)

class FilterGroup(db.Model):
    """Группы студентов для конкретной комбинации фильтров"""
    __tablename__ = 'filter_groups'

    id = db.Column(db.Integer, primary_key=True)
    city_instance_id = db.Column(db.Integer, db.ForeignKey('filter_city_instances.id'), nullable=False)
    group_name = db.Column(db.String(100), nullable=False)
    group_code = db.Column(db.String(50))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    articles = db.relationship('ArticleFilter', backref='filter_group', lazy=True)

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

# Обновленная модель Article с новой системой фильтрации
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

    # Новая система фильтрации
    filter_tree_id = db.Column(db.Integer, db.ForeignKey('filter_trees.id'))
    filter_path = db.Column(JSON)  # JSON с путем по дереву фильтров

    # Legacy fields (для обратной совместимости)
    tag = db.Column(db.String(20))
    base_class = db.Column(db.Integer)
    audience = db.Column(db.String(20))
    audience_city_id = db.Column(db.Integer, db.ForeignKey('cities.id'))
    audience_course = db.Column(db.Integer)
    audience_admission_year_id = db.Column(db.Integer, db.ForeignKey('admission_years.id'))
    audience_courses = db.Column(db.Text)
    education_mode = db.Column(db.String(20))
    education_form_id = db.Column(db.Integer, db.ForeignKey('education_forms.id'))
    speciality_id = db.Column(db.Integer, db.ForeignKey('specialities.id'))

    # Relationships
    authors = db.relationship('ArticleAuthor', backref='article', lazy=True)
    categories = db.relationship('ArticleCategory', backref='article', lazy=True)
    media_links = db.relationship('ArticleMediaLink', backref='article', lazy=True)
    reactions = db.relationship('ArticleReaction', backref='article', lazy=True)
    filter_assignments = db.relationship('ArticleFilter', backref='article', lazy=True)

class ArticleFilter(db.Model):
    """Связь статей с фильтрами"""
    __tablename__ = 'article_filters'

    id = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey('articles.id'), nullable=False)
    filter_group_id = db.Column(db.Integer, db.ForeignKey('filter_groups.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('article_id', 'filter_group_id'),)

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
