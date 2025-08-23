# seed_demo.py
# Purpose: Manually seed database with institution data, categories, groups and sample articles
# Effect: Creates minimal, cross-type demo data to validate schema and student feed logic

from app import create_app, db, bcrypt
from app.models import (
    InstitutionType, Role, User,
    TopCategory, Subcategory, Category,
    EducationForm, Speciality, SchoolClass, AdmissionYear, City, Group,
    Article, ArticleAuthor, ArticleCategory
)
from datetime import datetime


def get_or_create(model, defaults=None, **kwargs):
    instance = model.query.filter_by(**kwargs).first()
    if instance:
        return instance, False
    params = dict(kwargs)
    if defaults:
        params.update(defaults)
    instance = model(**params)
    db.session.add(instance)
    return instance, True


def ensure_roles():
    for name in ['Администратор', 'Редактор', 'Авторизованный читатель', 'Гостевой читатель']:
        get_or_create(Role, name=name)


def ensure_institution_types():
    types = {}
    for name in ['Школа', 'Колледж', 'Вуз']:
        inst, _ = get_or_create(InstitutionType, name=name)
        types[name] = inst
    return types


def ensure_cities():
    names = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Ростов-на-Дону']
    result = []
    for n in names:
        city, _ = get_or_create(City, name=n)
        result.append(city)
    return result


def ensure_education_forms(types):
    result = {}
    forms_map = {
        'Школа': ['Очная'],
        'Колледж': ['Очная', 'Заочная', 'Очно-заочная', 'Дистанционная'],
        'Вуз': ['Очная', 'Заочная', 'Очно-заочная'],
    }
    for inst_name, forms in forms_map.items():
        for form in forms:
            ef, _ = get_or_create(EducationForm, name=form, institution_type_id=types[inst_name].id)
            result[(inst_name, form)] = ef
    return result


def ensure_specialities(types):
    spec_map = {
        'Школа': [('SCH', 'Школьная программа')],
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
    result = {}
    for inst, items in spec_map.items():
        for code, name in items:
            s, _ = get_or_create(Speciality, code=code, institution_type_id=types[inst].id, defaults={'name': name})
            result[(inst, code)] = s
    return result


def ensure_school_classes(types):
    result = {}
    for name in ['5','6','7','8','9','10','11']:
        sc, _ = get_or_create(SchoolClass, name=name, institution_type_id=types['Школа'].id)
        result[name] = sc
    # College base-of classes
    for name in ['на базе 9-го класса', 'на базе 11-го класса']:
        sc, _ = get_or_create(SchoolClass, name=name, institution_type_id=types['Колледж'].id)
        result[name] = sc
    return result


def ensure_admission_years(types):
    result = {}
    year_now = datetime.utcnow().year
    years = [year_now - 3, year_now - 2, year_now - 1, year_now, year_now + 1]
    for year in years:
        for inst in ['Школа', 'Колледж', 'Вуз']:
            ay, _ = get_or_create(AdmissionYear, year=year, institution_type_id=types[inst].id)
            result[(inst, year)] = ay
    return result


def ensure_top_and_subcategories(types):
    # Top categories
    top_general, _ = get_or_create(TopCategory, slug='general', defaults={'name': 'Общая информация'})
    top_study, _ = get_or_create(TopCategory, slug='study', defaults={'name': 'Учебная информация'})
    # Subcategories for study
    sub_cur_sem, _ = get_or_create(Subcategory, top_category_id=top_study.id, slug='cur_semester', defaults={'name': 'Текущий семестр'})
    sub_resources, _ = get_or_create(Subcategory, top_category_id=top_study.id, slug='resources', defaults={'name': 'Ресурсы'})
    return {
        'top_general': top_general,
        'top_study': top_study,
        'sub_cur_sem': sub_cur_sem,
        'sub_resources': sub_resources,
    }


def ensure_admin():
    role = Role.query.filter_by(name='Администратор').first()
    user = User.query.filter_by(email='admin@test.com').first()
    if not user:
        hashed = bcrypt.generate_password_hash('Admin123!').decode('utf-8')
        user = User(email='admin@test.com', password=hashed, full_name='Admin User', role_id=role.id)
        db.session.add(user)
    return user


def ensure_groups(types, cities, forms, specs, classes, years):
    groups = []
    # Школа
    g_school, _ = get_or_create(
        Group,
        display_name='11-А',
        defaults={
            'speciality_id': specs[('Школа', 'SCH')].id,
            'education_form_id': forms[('Школа', 'Очная')].id,
            'admission_year_id': years[('Школа', 2024)].id,
            'school_class_id': classes['11'].id,
            'city_id': cities[0].id,
            'institution_type_id': types['Школа'].id,
        }
    )
    groups.append(g_school)
    # Колледж
    g_college, _ = get_or_create(
        Group,
        display_name='ИС-101',
        defaults={
            'speciality_id': specs[('Колледж', '09.02.07')].id,
            'education_form_id': forms[('Колледж', 'Очная')].id,
            'admission_year_id': years[('Колледж', 2023)].id,
            'school_class_id': None,
            'city_id': cities[0].id,
            'institution_type_id': types['Колледж'].id,
        }
    )
    groups.append(g_college)
    # Вуз
    g_university, _ = get_or_create(
        Group,
        display_name='MATH-101',
        defaults={
            'speciality_id': specs[('Вуз', '09.03.03')].id,
            'education_form_id': forms[('Вуз', 'Очная')].id,
            'admission_year_id': years[('Вуз', max(y for (k, y) in years.keys() if k == 'Вуз'))].id,
            'school_class_id': None,
            'city_id': cities[1].id,
            'institution_type_id': types['Вуз'].id,
        }
    )
    groups.append(g_university)
    return groups


def ensure_categories_link(top_and_sub, groups):
    cats = []
    # Global general category (no group)
    c_general, _ = get_or_create(Category, top_category_id=top_and_sub['top_general'].id, subcategory_id=None, group_id=None)
    cats.append(c_general)
    # Study categories per group
    for g in groups:
        c_study, _ = get_or_create(Category, top_category_id=top_and_sub['top_study'].id, subcategory_id=top_and_sub['sub_cur_sem'].id, group_id=g.id)
        cats.append(c_study)
    return cats


def create_articles(admin_user, cats, groups):
    created = 0
    # General welcome
    a1 = Article(title='Добро пожаловать', content='<p>Это общая информация для всех.</p>', is_published=True, is_actual=True, audience='all')
    db.session.add(a1); db.session.flush()
    db.session.add(ArticleAuthor(article_id=a1.id, user_id=admin_user.id))
    db.session.add(ArticleCategory(article_id=a1.id, category_id=cats[0].id))
    created += 1

    # School targeted (base_class 11)
    a2 = Article(title='Экзамены 11 класса', content='<p>График экзаменов для 11 класса.</p>', is_published=True, is_actual=True, base_class=11, audience='all')
    db.session.add(a2); db.session.flush()
    db.session.add(ArticleAuthor(article_id=a2.id, user_id=admin_user.id))
    # attach to school group study category
    school_group = next(g for g in groups if '11' in g.display_name)
    school_cat = Category.query.filter_by(group_id=school_group.id).first()
    if school_cat:
        db.session.add(ArticleCategory(article_id=a2.id, category_id=school_cat.id))
    created += 1

    # College targeted (course 1)
    a3 = Article(title='Сессия 1 курса', content='<p>Информация о сессии для 1 курса.</p>', is_published=True, is_actual=True, audience='course', audience_course=1)
    db.session.add(a3); db.session.flush()
    db.session.add(ArticleAuthor(article_id=a3.id, user_id=admin_user.id))
    college_group = next(g for g in groups if 'ИС-' in g.display_name)
    college_cat = Category.query.filter_by(group_id=college_group.id).first()
    if college_cat:
        db.session.add(ArticleCategory(article_id=a3.id, category_id=college_cat.id))
    created += 1

    # University general study
    a4 = Article(title='Расписание занятий', content='<p>Расписание на текущую неделю.</p>', is_published=True, is_actual=True, audience='all')
    db.session.add(a4); db.session.flush()
    db.session.add(ArticleAuthor(article_id=a4.id, user_id=admin_user.id))
    uni_group = next(g for g in groups if 'MATH' in g.display_name)
    uni_cat = Category.query.filter_by(group_id=uni_group.id).first()
    if uni_cat:
        db.session.add(ArticleCategory(article_id=a4.id, category_id=uni_cat.id))
    created += 1

    return created


def main():
    app = create_app('development')
    with app.app_context():
        db.create_all()
        ensure_roles()
        types = ensure_institution_types()
        cities = ensure_cities()
        forms = ensure_education_forms(types)
        specs = ensure_specialities(types)
        classes = ensure_school_classes(types)
        years = ensure_admission_years(types)
        tsc = ensure_top_and_subcategories(types)
        admin = ensure_admin()
        groups = ensure_groups(types, cities, forms, specs, classes, years)
        cats = ensure_categories_link(tsc, groups)
        created = create_articles(admin, cats, groups)
        db.session.commit()
        print(f"✅ Seed completed. Groups: {len(groups)}, Articles created: {created}")


if __name__ == '__main__':
    main()


