from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import (
    FilterTree, FilterInstitutionType, FilterGeneral, FilterCity,
    FilterStudyProgram, FilterCourse, FilterEducationForm,
    FilterCityInstance, FilterGroup, Article, ArticleFilter
)
from sqlalchemy.orm import joinedload
import json

filters_bp = Blueprint('filters', __name__)

@filters_bp.route('/tree', methods=['GET'])
def get_filter_tree():
    """Получить полное дерево фильтров"""
    try:
        # Получаем активное дерево фильтров
        filter_tree = FilterTree.query.filter_by(is_active=True).first()
        if not filter_tree:
            return jsonify({'error': 'No active filter tree found'}), 404

        # Строим иерархию
        tree_data = build_filter_hierarchy(filter_tree)

        return jsonify({
            'success': True,
            'data': tree_data
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@filters_bp.route('/tree', methods=['POST'])
@jwt_required()
def create_filter_tree():
    """Создать новое дерево фильтров"""
    try:
        data = request.get_json()

        # Проверяем права (только админ)
        # TODO: добавить проверку роли

        filter_tree = FilterTree(
            name=data.get('name'),
            description=data.get('description')
        )

        db.session.add(filter_tree)
        db.session.commit()

        return jsonify({
            'success': True,
            'data': {
                'id': filter_tree.id,
                'name': filter_tree.name
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@filters_bp.route('/tree/<int:tree_id>/structure', methods=['POST'])
@jwt_required()
def create_filter_structure(tree_id):
    """Создать структуру фильтров для дерева"""
    try:
        data = request.get_json()

        filter_tree = FilterTree.query.get_or_404(tree_id)

        # Создаем структуру согласно вашей схеме
        structure = data.get('structure', {})

        for inst_type_key, inst_type_data in structure.items():
            # Создаем тип учреждения
            inst_type = FilterInstitutionType(
                filter_tree_id=tree_id,
                type_key=inst_type_key,
                display_name=get_display_name(inst_type_key)
            )
            db.session.add(inst_type)
            db.session.flush()  # Получаем ID

            # Создаем общие фильтры
            for general_key in ['general', 'city', 'study_info']:
                general = FilterGeneral(
                    institution_type_id=inst_type.id,
                    filter_key=general_key,
                    display_name=get_display_name(general_key)
                )
                db.session.add(general)
                db.session.flush()

                if general_key == 'city':
                    # Создаем города
                    cities = ['nsk', 'spb', 'msk', 'ekb', 'krd', 'rnd']
                    for city_key in cities:
                        city = FilterCity(
                            institution_type_id=inst_type.id,
                            general_filter_id=general.id,
                            city_key=city_key,
                            display_name=get_city_display_name(city_key)
                        )
                        db.session.add(city)

                elif general_key == 'study_info':
                    # Создаем учебные программы
                    programs = [
                        'programming', 'sys_adm', 'design', 'commercial',
                        'web_design', 'gamedev', 'ai', '3d', 'cybersport',
                        'info_sec', 'tech'
                    ]

                    for program_key in programs:
                        program = FilterStudyProgram(
                            institution_type_id=inst_type.id,
                            general_filter_id=general.id,
                            program_key=program_key,
                            display_name=get_program_display_name(program_key)
                        )
                        db.session.add(program)
                        db.session.flush()

                        # Создаем курсы для каждой программы
                        courses = ['1 course', '2 course', '3 course', '4 course']
                        for course_key in courses:
                            course = FilterCourse(
                                study_program_id=program.id,
                                city_id=None,  # Будет установлено позже
                                course_key=course_key,
                                display_name=get_course_display_name(course_key)
                            )
                            db.session.add(course)
                            db.session.flush()

                            # Создаем формы обучения
                            forms = ['full_time', 'remote', 'dist', 'blended']
                            for form_key in forms:
                                form = FilterEducationForm(
                                    course_id=course.id,
                                    form_key=form_key,
                                    display_name=get_form_display_name(form_key)
                                )
                                db.session.add(form)
                                db.session.flush()

                                # Создаем города для каждой формы
                                cities = ['nsk', 'spb', 'msk', 'ekb', 'krd', 'rnd']
                                for city_key in cities:
                                    city_instance = FilterCityInstance(
                                        education_form_id=form.id,
                                        city_key=city_key,
                                        display_name=get_city_display_name(city_key)
                                    )
                                    db.session.add(city_instance)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Filter structure created successfully'
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@filters_bp.route('/articles', methods=['GET'])
def get_filtered_articles():
    """Инкрементальная фильтрация: каждый следующий параметр сужает выбор (AND).
    Поддержка как filter_path, так и полей аудитории (город/курс).
    Параметры: city, institution_type, program, course, form.
    """
    try:
        city = request.args.get('city')
        institution_type = request.args.get('institution_type')
        program = request.args.get('program')
        course = request.args.get('course')
        form = request.args.get('form')

        from sqlalchemy import or_, and_

        query = Article.query.filter(Article.is_published.is_(True))

        # City: accept either filter_path.city == city OR audience city match
        if city:
            # filter_path intersection
            fp_city = Article.filter_path.contains({'city': city})
            # audience mapping: resolve city_key -> City id if possible via a lightweight map
            from app.models import City
            resolved_id = None
            try:
                key_to_name = {
                    'nsk': 'Новосибирск',
                    'spb': 'Санкт-Петербург',
                    'msk': 'Москва',
                    'ekb': 'Екатеринбург',
                    'krd': 'Краснодар',
                    'rnd': 'Ростов-на-Дону',
                }
                target = key_to_name.get(city)
                if target:
                    from sqlalchemy import func
                    c = City.query.filter(func.lower(City.name) == func.lower(target)).first()
                    if c:
                        resolved_id = c.id
            except Exception:
                resolved_id = None
            aud_city = and_(Article.audience == 'city', Article.audience_city_id == resolved_id) if resolved_id else None
            query = query.filter(or_(fp_city, aud_city) if aud_city is not None else fp_city)

        if institution_type:
            query = query.filter(Article.filter_path.contains({'institution_type': institution_type}))
        if program:
            query = query.filter(Article.filter_path.contains({'program': program}))
        if course:
            # course may be numeric audience field or string in filter_path
            try:
                course_num = int(course)
            except Exception:
                course_num = None
            fp_course = Article.filter_path.contains({'course': str(course)})
            aud_course = and_(Article.audience == 'course', Article.audience_course == course_num) if course_num is not None else None
            query = query.filter(or_(fp_course, aud_course) if aud_course is not None else fp_course)
        if form:
            query = query.filter(Article.filter_path.contains({'form': form}))

        articles = query.order_by(Article.created_at.desc()).all()
        result = [{
            'id': a.id,
            'title': a.title,
            'content': (a.content[:200] + '...') if a.content and len(a.content) > 200 else (a.content or ''),
            'created_at': a.created_at.isoformat() if a.created_at else None,
            'filter_path': a.filter_path,
            'views_count': getattr(a, 'views_count', 0),
            'audience': a.audience,
            'audience_city_id': a.audience_city_id,
            'audience_course': a.audience_course,
        } for a in articles]
        return jsonify({'success': True, 'data': result, 'total': len(result)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@filters_bp.route('/articles/<int:article_id>/filters', methods=['POST'])
@jwt_required()
def assign_filters_to_article(article_id):
    """Назначить фильтры для статьи"""
    try:
        data = request.get_json()
        article = Article.query.get_or_404(article_id)

        # Создаем путь фильтрации
        filter_path = {
            'institution_type': data.get('institution_type'),
            'city': data.get('city'),
            'program': data.get('program'),
            'course': data.get('course'),
            'form': data.get('form')
        }

        # Обновляем статью
        article.filter_path = filter_path
        article.filter_tree_id = data.get('filter_tree_id')

        # Создаем связи с группами фильтров
        filter_group_ids = data.get('filter_group_ids', [])
        for group_id in filter_group_ids:
            article_filter = ArticleFilter(
                article_id=article.id,
                filter_group_id=group_id
            )
            db.session.add(article_filter)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Filters assigned successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def build_filter_hierarchy(filter_tree):
    """Построить иерархию фильтров"""
    hierarchy = {}

    for inst_type in filter_tree.institution_types:
        if not inst_type.is_active:
            continue

        hierarchy[inst_type.type_key] = {
            'display_name': inst_type.display_name,
            'general': {},
            'city': {},
            'study_info': {}
        }

        # Общие фильтры
        for general in inst_type.general_filters:
            if general.filter_key == 'general':
                hierarchy[inst_type.type_key]['general'] = {
                    'id': general.id,
                    'display_name': general.display_name
                }
            elif general.filter_key == 'city':
                hierarchy[inst_type.type_key]['city'] = {}
                for city in general.city_filters:
                    hierarchy[inst_type.type_key]['city'][city.city_key] = {
                        'id': city.id,
                        'display_name': city.display_name
                    }
            elif general.filter_key == 'study_info':
                hierarchy[inst_type.type_key]['study_info'] = {}
                for program in general.study_info_filters:
                    hierarchy[inst_type.type_key]['study_info'][program.program_key] = {}
                    for course in program.courses:
                        hierarchy[inst_type.type_key]['study_info'][program.program_key][course.course_key] = {}
                        for form in course.education_forms:
                            hierarchy[inst_type.type_key]['study_info'][program.program_key][course.course_key][form.form_key] = {}
                            for city_instance in form.city_instances:
                                hierarchy[inst_type.type_key]['study_info'][program.program_key][course.course_key][form.form_key][city_instance.city_key] = {
                                    'id': city_instance.id,
                                    'display_name': city_instance.display_name
                                }

    return hierarchy

def get_display_name(key):
    """Получить отображаемое имя для ключа"""
    display_names = {
        'college': 'Колледж',
        'university': 'Университет',
        'school': 'Школа',
        'general': 'Общее',
        'city': 'Город',
        'study_info': 'Учебная информация',
        'programming': 'Программирование',
        'sys_adm': 'Системное администрирование',
        'design': 'Дизайн',
        'commercial': 'Реклама',
        'web_design': 'Веб-дизайн',
        'gamedev': 'Разработка игр',
        'ai': 'Искусственный интеллект',
        '3d': '3D моделирование',
        'cybersport': 'Киберспорт',
        'info_sec': 'Информационная безопасность',
        'tech': 'Технологии',
        'full_time': 'Очная',
        'remote': 'Заочная',
        'dist': 'Дистанционная',
        'blended': 'Смешанная'
    }
    return display_names.get(key, key)

def get_city_display_name(key):
    """Получить отображаемое имя города"""
    city_names = {
        'nsk': 'Новосибирск',
        'spb': 'Санкт-Петербург',
        'msk': 'Москва',
        'ekb': 'Екатеринбург',
        'krd': 'Краснодар',
        'rnd': 'Ростов-на-Дону'
    }
    return city_names.get(key, key)

def get_program_display_name(key):
    """Получить отображаемое имя программы"""
    program_names = {
        'programming': 'Программирование',
        'sys_adm': 'Системное администрирование',
        'design': 'Дизайн',
        'commercial': 'Реклама',
        'web_design': 'Веб-дизайн',
        'gamedev': 'Разработка игр',
        'ai': 'Искусственный интеллект',
        '3d': '3D моделирование',
        'cybersport': 'Киберспорт',
        'info_sec': 'Информационная безопасность',
        'tech': 'Технологии'
    }
    return program_names.get(key, key)

def get_course_display_name(key):
    """Получить отображаемое имя курса"""
    course_names = {
        '1 course': '1 курс',
        '2 course': '2 курс',
        '3 course': '3 курс',
        '4 course': '4 курс'
    }
    return course_names.get(key, key)

def get_form_display_name(key):
    """Получить отображаемое имя формы обучения"""
    form_names = {
        'full_time': 'Очная',
        'remote': 'Заочная',
        'dist': 'Дистанционная',
        'blended': 'Смешанная'
    }
    return form_names.get(key, key)
