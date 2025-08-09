# create_admin.py
# Purpose: Upsert an admin user (admin@test.com / Admin123!) directly in the database using the Flask app context

import os
from app import create_app, db, bcrypt
from app.models import User, Role


def ensure_admin(email: str = None, password: str = None) -> None:
    # Allow override via environment variables
    if not email:
        email = os.getenv("CREATE_ADMIN_EMAIL", "admin@test.com")
    if not password:
        password = os.getenv("CREATE_ADMIN_PASSWORD", "Admin123!")
    app = create_app('development')
    with app.app_context():
        role = Role.query.filter_by(name='Администратор').first()
        if role is None:
            role = Role(name='Администратор')
            db.session.add(role)
            db.session.commit()

        user = User.query.filter_by(email=email).first()
        hashed = bcrypt.generate_password_hash(password).decode('utf-8')

        if user is None:
            user = User(
                email=email,
                full_name='Admin User',
                role_id=role.id,
                password=hashed,  # IMPORTANT: model field is `password`
            )
            db.session.add(user)
        else:
            user.password = hashed
            if not user.role_id:
                user.role_id = role.id

        db.session.commit()
        print(f"✅ Admin user ready: {user.email} (id={user.id})")


if __name__ == '__main__':
    ensure_admin()
