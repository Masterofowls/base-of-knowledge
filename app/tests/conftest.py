import os
import pytest

os.environ.setdefault('DATABASE_URL', 'sqlite://')
os.environ.setdefault('JWT_SECRET_KEY', 'test-secret')

from app import create_app, db
from app.models import (
    InstitutionType, EducationForm, Speciality, AdmissionYear, SchoolClass,
    City, Group, Role, User
)
from flask_jwt_extended import create_access_token
from flask_bcrypt import generate_password_hash


@pytest.fixture(scope='session')
def app():
    app = create_app('production')
    with app.app_context():
        db.drop_all()
        db.create_all()
        # seed minimal dictionaries
        it_college = InstitutionType(name='Колледж')
        it_univ = InstitutionType(name='Вуз')
        it_school = InstitutionType(name='Школа')
        db.session.add_all([it_college, it_univ, it_school])
        db.session.flush()

        ef_full = EducationForm(name='Очная', institution_type_id=it_univ.id)
        ef_dist = EducationForm(name='Заочная', institution_type_id=it_univ.id)
        db.session.add_all([ef_full, ef_dist])
        db.session.flush()

        sp_it = Speciality(code='01.03', name='Информатика', institution_type_id=it_univ.id)
        db.session.add(sp_it)
        db.session.flush()

        ay_cur = AdmissionYear(year=2025, institution_type_id=it_univ.id)
        ay_prev = AdmissionYear(year=2024, institution_type_id=it_univ.id)
        db.session.add_all([ay_cur, ay_prev])
        db.session.flush()

        sc9 = SchoolClass(name='9', institution_type_id=it_school.id)
        db.session.add(sc9)
        db.session.flush()

        city_spb = City(name='Санкт-Петербург')
        city_msk = City(name='Москва')
        db.session.add_all([city_spb, city_msk])
        db.session.flush()

        # user & role
        role_admin = Role(name='Администратор')
        db.session.add(role_admin)
        db.session.flush()

        admin = User(email='admin@test.local', password=generate_password_hash('Admin123!').decode(), role_id=role_admin.id)
        db.session.add(admin)

        # sample groups
        g1 = Group(display_name='ВУЗ-ИТ-ОЧ-2025-SPB', speciality_id=sp_it.id, education_form_id=ef_full.id, admission_year_id=ay_cur.id, city_id=city_spb.id, institution_type_id=it_univ.id)
        g2 = Group(display_name='ВУЗ-ИТ-ЗАОЧ-2024-MSK', speciality_id=sp_it.id, education_form_id=ef_dist.id, admission_year_id=ay_prev.id, city_id=city_msk.id, institution_type_id=it_univ.id)
        db.session.add_all([g1, g2])
        db.session.commit()
    yield app


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def auth_header(app):
    with app.app_context():
        token = create_access_token(identity='1')
        return { 'Authorization': f'Bearer {token}' }


