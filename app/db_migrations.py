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
                "CREATE EXTENSION IF NOT EXISTS unaccent",
                "CREATE EXTENSION IF NOT EXISTS pg_trgm",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS tag VARCHAR(20)",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS base_class INTEGER",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience VARCHAR(20)",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_city_id INTEGER",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_course INTEGER",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_admission_year_id INTEGER",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_courses TEXT",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS education_mode VARCHAR(20)",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS education_form_id INTEGER",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS speciality_id INTEGER",
            ]
            for stmt in statements:
                conn.execute(text(stmt))
            # FTS GIN index for title+content (russian); fallback to 'simple' if russian not available
            try:
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS idx_articles_fts ON articles USING GIN (to_tsvector('russian', coalesce(title,'') || ' ' || coalesce(content,'')))"
                ))
            except Exception:
                conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS idx_articles_fts ON articles USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')))"
                ))
            # Helpful btree indexes
            for idx_stmt in [
                "CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles (created_at DESC)",
                "CREATE INDEX IF NOT EXISTS idx_articles_tag ON articles (tag)",
                "CREATE INDEX IF NOT EXISTS idx_articles_audience ON articles (audience)",
                "CREATE INDEX IF NOT EXISTS idx_articles_base_class ON articles (base_class)",
                "CREATE INDEX IF NOT EXISTS idx_articles_city ON articles (audience_city_id)",
                "CREATE INDEX IF NOT EXISTS idx_articles_course ON articles (audience_course)"
            ]:
                try:
                    conn.execute(text(idx_stmt))
                except Exception:
                    pass
            # Add archive flag and audit table for groups
            try:
                conn.execute(text("ALTER TABLE groupss ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE"))
            except Exception:
                pass
            # Add base_class to groups (9 or 11)
            try:
                conn.execute(text("ALTER TABLE groupss ADD COLUMN IF NOT EXISTS base_class INTEGER"))
            except Exception:
                pass
            conn.execute(text(
                """
                CREATE TABLE IF NOT EXISTS group_audit_logs (
                  id SERIAL PRIMARY KEY,
                  group_id INTEGER,
                  user_id INTEGER,
                  action VARCHAR(50) NOT NULL,
                  details TEXT,
                  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
                )
                """
            ))

        elif dialect == 'mysql':  # MySQL 8+
            statements = [
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS tag VARCHAR(20)",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS base_class INT",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience VARCHAR(20)",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_city_id INT",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_course INT",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_admission_year_id INT",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS audience_courses TEXT",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS education_mode VARCHAR(20)",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS education_form_id INT",
                "ALTER TABLE articles ADD COLUMN IF NOT EXISTS speciality_id INT",
            ]
            for stmt in statements:
                conn.execute(text(stmt))
            # Add archive flag and audit table for groups (MySQL)
            try:
                conn.execute(text("ALTER TABLE groupss ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE groupss ADD COLUMN IF NOT EXISTS base_class INT"))
            except Exception:
                pass
            conn.execute(text(
                """
                CREATE TABLE IF NOT EXISTS group_audit_logs (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  group_id INT,
                  user_id INT,
                  action VARCHAR(50) NOT NULL,
                  details TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            ))
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
            try:
                conn.execute(text("ALTER TABLE groupss ADD COLUMN base_class INTEGER"))
            except Exception:
                pass


