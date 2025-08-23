#!/usr/bin/env python3
"""
Database initialization script for the Knowledge Base System.
This script creates the database tables and populates them with sample data.
"""

from app import create_app, db
from app.models import *
from app import bcrypt
import os

def init_database():
    """Initialize the database with tables and sample data"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        
        # Create default roles
        print("Creating default roles...")
        roles = Role.query.all()
        if not roles:
            admin_role = Role(name='Администратор')
            editor_role = Role(name='Редактор')
            staff_role = Role(name='Авторизованный читатель')
            guest_role = Role(name='Гостевой читатель')
            
            db.session.add(admin_role)
            db.session.add(editor_role)
            db.session.add(staff_role)
            db.session.add(guest_role)
            db.session.commit()
            print("✓ Default roles created")
        else:
            print("✓ Roles already exist")
        
        # Create default institution types
        print("Creating default institution types...")
        institution_types = InstitutionType.query.all()
        if not institution_types:
            college_type = InstitutionType(name='Колледж')
            university_type = InstitutionType(name='Вуз')
            school_type = InstitutionType(name='Школа')
            
            db.session.add(college_type)
            db.session.add(university_type)
            db.session.add(school_type)
            db.session.commit()
            print("✓ Default institution types created")
        else:
            print("✓ Institution types already exist")
        
        # Create default admin user
        print("Creating default admin user...")
        admin_user = User.query.filter_by(email='admin@example.com').first()
        if not admin_user:
            admin_role = Role.query.filter_by(name='Администратор').first()
            hashed_password = bcrypt.generate_password_hash('Admin123!').decode('utf-8')
            
            admin_user = User(
                email='admin@example.com',
                password=hashed_password,
                full_name='Администратор Системы',
                role_id=admin_role.id
            )
            
            db.session.add(admin_user)
            db.session.commit()
            print("✓ Default admin user created (email: admin@example.com, password: Admin123!)")
        else:
            print("✓ Admin user already exists")
        
        # Create sample top categories
        print("Creating sample top categories...")
        top_categories = TopCategory.query.all()
        if not top_categories:
            college_type = InstitutionType.query.filter_by(name='Колледж').first()
            
            general_category = TopCategory(
                slug='general',
                name='Общая информация',
                institution_type_id=college_type.id
            )
            
            study_category = TopCategory(
                slug='study',
                name='Учебная информация',
                institution_type_id=college_type.id
            )
            
            city_category = TopCategory(
                slug='city',
                name='Город',
                institution_type_id=college_type.id
            )
            
            db.session.add(general_category)
            db.session.add(study_category)
            db.session.add(city_category)
            db.session.commit()
            print("✓ Sample top categories created")
        else:
            print("✓ Top categories already exist")
        
        # Create sample subcategories
        print("Creating sample subcategories...")
        subcategories = Subcategory.query.all()
        if not subcategories:
            general_category = TopCategory.query.filter_by(slug='general').first()
            study_category = TopCategory.query.filter_by(slug='study').first()
            
            about_college = Subcategory(
                top_category_id=general_category.id,
                slug='about-college',
                name='О колледже'
            )
            
            resources = Subcategory(
                top_category_id=general_category.id,
                slug='resources',
                name='Ресурсы'
            )
            
            current_semester = Subcategory(
                top_category_id=study_category.id,
                slug='current-semester',
                name='Текущий семестр'
            )
            
            db.session.add(about_college)
            db.session.add(resources)
            db.session.add(current_semester)
            db.session.commit()
            print("✓ Sample subcategories created")
        else:
            print("✓ Subcategories already exist")
        
        # Ensure required cities
        print("Ensuring required cities exist...")
        required_cities = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Ростов-на-Дону']
        created_cities = 0
        for name in required_cities:
            if not City.query.filter_by(name=name).first():
                db.session.add(City(name=name))
                created_cities += 1
        if created_cities:
            db.session.commit()
        print(f"✓ Cities ensured (added: {created_cities})")
        
        # Ensure education forms (per institution type)
        print("Ensuring education forms exist for institution types...")
        forms_map = {
            'Колледж': ['Очная', 'Заочная', 'Очно-заочная', 'Дистанционная'],
            'Вуз': ['Очная', 'Заочная', 'Очно-заочная'],
        }
        for inst_name, form_names in forms_map.items():
            inst = InstitutionType.query.filter_by(name=inst_name).first()
            if not inst:
                continue
            added_forms = 0
            for fname in form_names:
                if not EducationForm.query.filter_by(institution_type_id=inst.id, name=fname).first():
                    db.session.add(EducationForm(name=fname, institution_type_id=inst.id))
                    added_forms += 1
            if added_forms:
                db.session.commit()
            print(f"  ✓ {inst_name}: education forms ensured (added: {added_forms})")
        
        # Ensure specialities for College and University
        print("Ensuring specialities exist...")
        college = InstitutionType.query.filter_by(name='Колледж').first()
        university = InstitutionType.query.filter_by(name='Вуз').first()
        college_specs = [
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
        ]
        university_specs = [
            ('09.03.03', 'Прикладная информатика'),
            ('42.03.01', 'Реклама и связи с общественностью'),
            ('54.03.01', 'Дизайн'),
        ]
        if college:
            added = 0
            for code, name in college_specs:
                if not Speciality.query.filter_by(institution_type_id=college.id, code=code).first():
                    db.session.add(Speciality(code=code, name=name, institution_type_id=college.id))
                    added += 1
            if added:
                db.session.commit()
            print(f"  ✓ Колледж: specialities ensured (added: {added})")
        if university:
            added = 0
            for code, name in university_specs:
                if not Speciality.query.filter_by(institution_type_id=university.id, code=code).first():
                    db.session.add(Speciality(code=code, name=name, institution_type_id=university.id))
                    added += 1
            if added:
                db.session.commit()
            print(f"  ✓ Вуз: specialities ensured (added: {added})")
        
        # Ensure dynamic admission years for College and University (current±)
        print("Ensuring admission years exist (current±3, +1)...")
        from datetime import datetime
        y = datetime.utcnow().year
        years_to_ensure = [y - 3, y - 2, y - 1, y, y + 1]
        for inst_name in ('Колледж', 'Вуз'):
            inst = InstitutionType.query.filter_by(name=inst_name).first()
            if not inst:
                continue
            added_years = 0
            for yr in years_to_ensure:
                if not AdmissionYear.query.filter_by(institution_type_id=inst.id, year=yr).first():
                    db.session.add(AdmissionYear(year=yr, description=f'{yr} год поступления', institution_type_id=inst.id))
                    added_years += 1
            if added_years:
                db.session.commit()
            print(f"  ✓ {inst_name}: admission years ensured (added: {added_years})")
        
        print("\n🎉 Database initialization completed successfully!")
        print("\nDefault admin credentials:")
        print("Email: admin@example.com")
        print("Password: Admin123!")
        print("\nYou can now run the application with: python run.py")

if __name__ == '__main__':
    init_database()
