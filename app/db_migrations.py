from sqlalchemy import text


def run_startup_migrations(db):
    """
    Minimal, idempotent migrations executed at startup.
    Adds new Article scope columns if they are missing.
    Works on Postgres (Neon) and MySQL 8+ using IF NOT EXISTS.
    """
    engine = db.engine
    dialect = engine.url.get_dialect().name  # 'postgresql' | 'mysql' | etc.

    with engine.begin() as conn:
        if dialect == 'postgresql':
            statements = [
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS tag VARCHAR(20)",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS base_class INTEGER",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience VARCHAR(20)",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_city_id INTEGER",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_course INTEGER",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_admission_year_id INTEGER",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_courses TEXT",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS education_mode VARCHAR(20)",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS speciality_id INTEGER",
            ]
            for stmt in statements:
                conn.execute(text(stmt))
            # Optional FK can be added if needed; skipping to keep idempotent

        elif dialect == 'mysql':  # MySQL 8+
            statements = [
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS tag VARCHAR(20)",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS base_class INT",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience VARCHAR(20)",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_city_id INT",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_course INT",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_admission_year_id INT",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_courses TEXT",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS education_mode VARCHAR(20)",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS speciality_id INT",
            ]
            for stmt in statements:
                conn.execute(text(stmt))
        else:
            # Fallback: attempt generic ADD COLUMN, ignore if exists
            try:
                conn.execute(text("ALTER TABLE articles ADD COLUMN tag VARCHAR(20)"))
            except Exception:
                pass
            for col_stmt in [
                "ALTER TABLE articles ADD COLUMN base_class INTEGER",
                "ALTER TABLE articles ADD COLUMN audience VARCHAR(20)",
                "ALTER TABLE articles ADD COLUMN audience_city_id INTEGER",
                "ALTER TABLE articles ADD COLUMN audience_course INTEGER",
                "ALTER TABLE articles ADD COLUMN audience_admission_year_id INTEGER",
                "ALTER TABLE articles ADD COLUMN audience_courses TEXT",
                "ALTER TABLE articles ADD COLUMN education_mode VARCHAR(20)",
                "ALTER TABLE articles ADD COLUMN speciality_id INTEGER",
            ]:
                try:
                    conn.execute(text(col_stmt))
                except Exception:
                    pass


