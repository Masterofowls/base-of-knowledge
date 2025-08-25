#!/usr/bin/env python3
"""
Скрипт для инициализации иерархической структуры фильтров
"""

import os
import sys
from app import create_app, db
from app.models import (
    FilterTree, FilterInstitutionType, FilterGeneral, FilterCity,
    FilterStudyProgram, FilterCourse, FilterEducationForm,
    FilterCityInstance, FilterGroup
)

def init_filter_structure():
    """Инициализация структуры фильтров согласно схеме пользователя"""

    app = create_app()

    with app.app_context():
        try:
            # Создаем основное дерево фильтров
            filter_tree = FilterTree.query.filter_by(is_active=True).first()
            if not filter_tree:
                filter_tree = FilterTree(
                    name="Основное дерево фильтров",
                    description="Иерархическая структура фильтров для образовательных учреждений"
                )
                db.session.add(filter_tree)
                db.session.flush()
                print(f"Создано дерево фильтров: {filter_tree.name}")
            else:
                print(f"Используется существующее дерево фильтров: {filter_tree.name}")

            # Если типы уже существуют для этого дерева, считаем структуру созданной
            from app.models import FilterInstitutionType as _FIT
            existing_fit = _FIT.query.filter_by(filter_tree_id=filter_tree.id, type_key='college').first()
            if existing_fit:
                print("Структура фильтров уже создана (найден 'college'). Пропуск инициализации.")
                db.session.rollback()
                return

            # Структура согласно вашей схеме
            structure = {
                'college': {
                    'general': ['id', 'id'],
                    'city': {
                        'nsk': {},
                        'spb': {},
                        'msk': {},
                        'ekb': {},
                        'krd': {},
                        'rnd': {}
                    },
                    'study_info': {
                        'programming': {
                            '1 course': {
                                'full_time': {
                                    'nsk': {'id'},
                                    'spb': {},
                                    'msk': {},
                                    'ekb': {},
                                    'krd': {},
                                    'rnd': {}
                                },
                                'remote': {
                                    'nsk': {},
                                    'spb': {},
                                    'msk': {},
                                    'ekb': {},
                                    'krd': {},
                                    'rnd': {}
                                },
                                'dist': {
                                    'nsk': {},
                                    'spb': {},
                                    'msk': {},
                                    'ekb': {},
                                    'krd': {},
                                    'rnd': {}
                                },
                                'blended': {
                                    'nsk': {},
                                    'spb': {},
                                    'msk': {},
                                    'ekb': {},
                                    'krd': {},
                                    'rnd': {}
                                }
                            },
                            '2 course': {
                                'full_time': {
                                    'nsk': {},
                                    'spb': {},
                                    'msk': {},
                                    'ekb': {},
                                    'krd': {},
                                    'rnd': {}
                                },
                                'remote': {
                                    'nsk': {},
                                    'spb': {},
                                    'msk': {},
                                    'ekb': {},
                                    'krd': {},
                                    'rnd': {}
                                },
                                'dist': {
                                    'nsk': {},
                                    'spb': {},
                                    'msk': {},
                                    'ekb': {},
                                    'krd': {},
                                    'rnd': {}
                                },
                                'blended': {
                                    'nsk': {},
                                    'spb': {},
                                    'msk': {},
                                    'ekb': {},
                                    'krd': {},
                                    'rnd': {}
                                }
                            },
                            '3 course': {
                                'full_time': {
                                    'nsk': {},
                                    'spb': {},
                                    'msk': {},
                                    'ekb': {},
                                    'krd': {},
                                    'rnd': {}
                                },
                                'remote': {
                                    'nsk': {},
                                    'spb': {},
                                    'msk': {},
                                    'ekb': {},
                                    'krd': {},
                                    'rnd': {}
                                },
                                'dist': {
                                    'nsk': {},
                                    'spb': {},
                                    'msk': {},
                                    'ekb': {},
                                    'krd': {},
                                    'rnd': {}
                                },
                                'blended': {
                                    'nsk': {},
                                    'spb': {},
                                    'msk': {},
                                    'ekb': {},
                                    'krd': {},
                                    'rnd': {}
                                }
                            },
                            '4 course': {}
                        },
                        'sys_adm': {
                            '1 course': {},
                            '2 course': {},
                            '3 course': {},
                            '4 course': {}
                        },
                        'design': {
                            '1 course': {},
                            '2 course': {},
                            '3 course': {},
                            '4 course': {}
                        },
                        'commercial': {
                            '1 course': {},
                            '2 course': {},
                            '3 course': {},
                            '4 course': {}
                        },
                        'web_design': {
                            '1 course': {},
                            '2 course': {},
                            '3 course': {},
                            '4 course': {}
                        },
                        'gamedev': {
                            '1 course': {},
                            '2 course': {},
                            '3 course': {},
                            '4 course': {}
                        },
                        'ai': {
                            '1 course': {},
                            '2 course': {},
                            '3 course': {},
                            '4 course': {}
                        },
                        '3d': {},
                        'cybersport': {},
                        'info_sec': {},
                        'tech': {}
                    }
                },
                'university': {},
                'school': {}
            }

            # Создаем структуру для колледжа
            college_type = FilterInstitutionType(
                filter_tree_id=filter_tree.id,
                type_key='college',
                display_name='Колледж',
                sort_order=1
            )
            db.session.add(college_type)
            db.session.flush()
            print("Создан тип учреждения: Колледж")

            # Создаем общие фильтры для колледжа
            general_filters = {}
            for filter_key in ['general', 'city', 'study_info']:
                general = FilterGeneral(
                    institution_type_id=college_type.id,
                    filter_key=filter_key,
                    display_name=get_display_name(filter_key),
                    sort_order=1
                )
                db.session.add(general)
                db.session.flush()
                general_filters[filter_key] = general
                print(f"Создан общий фильтр: {get_display_name(filter_key)}")

            # Создаем города
            cities = ['nsk', 'spb', 'msk', 'ekb', 'krd', 'rnd']
            city_filters = {}
            for city_key in cities:
                city = FilterCity(
                    institution_type_id=college_type.id,
                    general_filter_id=general_filters['city'].id,
                    city_key=city_key,
                    display_name=get_city_display_name(city_key),
                    sort_order=1
                )
                db.session.add(city)
                db.session.flush()
                city_filters[city_key] = city
                print(f"Создан город: {get_city_display_name(city_key)}")

            # Создаем учебные программы
            programs = [
                'programming', 'sys_adm', 'design', 'commercial',
                'web_design', 'gamedev', 'ai', '3d', 'cybersport',
                'info_sec', 'tech'
            ]

            for program_key in programs:
                program = FilterStudyProgram(
                    institution_type_id=college_type.id,
                    general_filter_id=general_filters['study_info'].id,
                    program_key=program_key,
                    display_name=get_program_display_name(program_key),
                    sort_order=1
                )
                db.session.add(program)
                db.session.flush()
                print(f"Создана программа: {get_program_display_name(program_key)}")

                # Создаем курсы для каждой программы
                courses = ['1 course', '2 course', '3 course', '4 course']
                # Привязываем курсы к базовому городу, чтобы избежать NOT NULL ограничений
                default_city = city_filters.get('msk') or next(iter(city_filters.values()))
                for course_key in courses:
                    course = FilterCourse(
                        study_program_id=program.id,
                        city_id=(default_city.id if default_city else None),
                        course_key=course_key,
                        display_name=get_course_display_name(course_key),
                        sort_order=1
                    )
                    db.session.add(course)
                    db.session.flush()
                    print(f"  Создан курс: {get_course_display_name(course_key)}")

                    # Создаем формы обучения
                    forms = ['full_time', 'remote', 'dist', 'blended']
                    for form_key in forms:
                        form = FilterEducationForm(
                            course_id=course.id,
                            form_key=form_key,
                            display_name=get_form_display_name(form_key),
                            sort_order=1
                        )
                        db.session.add(form)
                        db.session.flush()
                        print(f"    Создана форма: {get_form_display_name(form_key)}")

                        # Создаем города для каждой формы
                        for city_key in cities:
                            city_instance = FilterCityInstance(
                                education_form_id=form.id,
                                city_key=city_key,
                                display_name=get_city_display_name(city_key),
                                sort_order=1
                            )
                            db.session.add(city_instance)
                            print(f"      Создан город для формы: {get_city_display_name(city_key)}")

            # Создаем университет
            university_type = FilterInstitutionType(
                filter_tree_id=filter_tree.id,
                type_key='university',
                display_name='Университет',
                sort_order=2
            )
            db.session.add(university_type)
            print("Создан тип учреждения: Университет")

            # Создаем школу
            school_type = FilterInstitutionType(
                filter_tree_id=filter_tree.id,
                type_key='school',
                display_name='Школа',
                sort_order=3
            )
            db.session.add(school_type)
            print("Создан тип учреждения: Школа")

            db.session.commit()
            print("\n✅ Структура фильтров успешно создана!")

        except Exception as e:
            db.session.rollback()
            print(f"❌ Ошибка при создании структуры фильтров: {e}")
            raise

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

if __name__ == '__main__':
    print("🚀 Инициализация структуры фильтров...")
    init_filter_structure()
    print("✨ Готово!")
