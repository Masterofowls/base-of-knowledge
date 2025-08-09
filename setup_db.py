#!/usr/bin/env python3
"""
Setup MySQL database and user for the Knowledge Base System.
Reads root password from env MYSQL_ROOT_PASSWORD.
"""
import os
import sys
import pymysql

ROOT_PASSWORD = os.environ.get('MYSQL_ROOT_PASSWORD')
if not ROOT_PASSWORD:
    print('ERROR: MYSQL_ROOT_PASSWORD env var is not set.', file=sys.stderr)
    sys.exit(1)

DB_NAME = os.environ.get('KB_DB_NAME', 'knowledge_base')
APP_USER = os.environ.get('KB_DB_USER', 'kb_user')
APP_PASS = os.environ.get('KB_DB_PASS', 'kb_password')

conn = pymysql.connect(host='localhost', user='root', password=ROOT_PASSWORD, autocommit=True)
try:
    with conn.cursor() as cur:
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        cur.execute(f"CREATE USER IF NOT EXISTS '{APP_USER}'@'localhost' IDENTIFIED BY '{APP_PASS}'")
        cur.execute(f"GRANT ALL PRIVILEGES ON `{DB_NAME}`.* TO '{APP_USER}'@'localhost'")
        cur.execute("FLUSH PRIVILEGES")
        print(f"✓ Database `{DB_NAME}` and user `{APP_USER}` are ready")
finally:
    conn.close()
