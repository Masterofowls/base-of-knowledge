from app import create_app, db
from app.models import *

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Create default roles if they don't exist
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
        
        # Create default institution types if they don't exist
        institution_types = InstitutionType.query.all()
        if not institution_types:
            college_type = InstitutionType(name='Колледж')
            university_type = InstitutionType(name='Вуз')
            school_type = InstitutionType(name='Школа')
            
            db.session.add(college_type)
            db.session.add(university_type)
            db.session.add(school_type)
            db.session.commit()
    
    app.run(debug=True, host='0.0.0.0', port=5000)
