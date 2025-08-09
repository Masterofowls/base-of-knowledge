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
        
        # Create sample cities
        print("Creating sample cities...")
        cities = City.query.all()
        if not cities:
            moscow = City(name='Москва')
            spb = City(name='Санкт-Петербург')
            kazan = City(name='Казань')
            
            db.session.add(moscow)
            db.session.add(spb)
            db.session.add(kazan)
            db.session.commit()
            print("✓ Sample cities created")
        else:
            print("✓ Cities already exist")
        
        # Create sample education forms
        print("Creating sample education forms...")
        education_forms = EducationForm.query.all()
        if not education_forms:
            college_type = InstitutionType.query.filter_by(name='Колледж').first()
            
            full_time = EducationForm(name='Очная', institution_type_id=college_type.id)
            part_time = EducationForm(name='Заочная', institution_type_id=college_type.id)
            distance = EducationForm(name='Дистанционная', institution_type_id=college_type.id)
            
            db.session.add(full_time)
            db.session.add(part_time)
            db.session.add(distance)
            db.session.commit()
            print("✓ Sample education forms created")
        else:
            print("✓ Education forms already exist")
        
        # Create sample specialities
        print("Creating sample specialities...")
        specialities = Speciality.query.all()
        if not specialities:
            college_type = InstitutionType.query.filter_by(name='Колледж').first()
            
            isp = Speciality(
                code='09.02.07',
                name='Информационные системы и программирование',
                institution_type_id=college_type.id
            )
            
            economics = Speciality(
                code='38.02.01',
                name='Экономика и бухгалтерский учет',
                institution_type_id=college_type.id
            )
            
            db.session.add(isp)
            db.session.add(economics)
            db.session.commit()
            print("✓ Sample specialities created")
        else:
            print("✓ Specialities already exist")
        
        # Create sample admission years
        print("Creating sample admission years...")
        admission_years = AdmissionYear.query.all()
        if not admission_years:
            college_type = InstitutionType.query.filter_by(name='Колледж').first()
            
            year_2023 = AdmissionYear(year=2023, description='2023 год поступления', institution_type_id=college_type.id)
            year_2024 = AdmissionYear(year=2024, description='2024 год поступления', institution_type_id=college_type.id)
            
            db.session.add(year_2023)
            db.session.add(year_2024)
            db.session.commit()
            print("✓ Sample admission years created")
        else:
            print("✓ Admission years already exist")
        
        print("\n🎉 Database initialization completed successfully!")
        print("\nDefault admin credentials:")
        print("Email: admin@example.com")
        print("Password: Admin123!")
        print("\nYou can now run the application with: python run.py")

if __name__ == '__main__':
    init_database()
