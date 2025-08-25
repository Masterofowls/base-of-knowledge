import os
import sys
import subprocess
import paramiko

SERVER = os.environ.get('KB_DEPLOY_SERVER', '89.169.44.175')
USER = os.environ.get('KB_DEPLOY_USER', 'root')
PASSWORD = os.environ.get('KB_DEPLOY_PASSWORD')
REMOTE_PATH = '/opt/kb/app'
ARCHIVE_NAME = 'kb.tar'

if not PASSWORD:
    print('ERR: Set KB_DEPLOY_PASSWORD env var')
    sys.exit(2)

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
os.chdir(repo_root)

print('> creating git archive...')
subprocess.run(['git', 'archive', '--format=tar', 'HEAD', '-o', ARCHIVE_NAME], check=True)

print(f'> connecting to {USER}@{SERVER} ...')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASSWORD, timeout=30)

stdin, stdout, stderr = client.exec_command(f"mkdir -p {REMOTE_PATH}")
stdout.channel.recv_exit_status()

print('> uploading archive...')
sftp = client.open_sftp()
sftp.put(ARCHIVE_NAME, f"{REMOTE_PATH}/{ARCHIVE_NAME}")
sftp.close()

remote_script = f"""
set -e
cd {REMOTE_PATH}
tar -xf {ARCHIVE_NAME}
# Backend build & run
docker build -t kb-backend .
(docker rm -f kb-api >/dev/null 2>&1) || true
# Run backend on port 9000 and link to postgres_default network
docker run -d --name kb-api --restart unless-stopped \
  --network postgres_default -p 9000:8080 \
  -e DATABASE_URL='postgresql+psycopg2://kb_user:change_me_strong@kb-db:5432/knowledge_base' \
  -e JWT_SECRET_KEY='change-me' \
  kb-backend
# DB migrations (try upgrade; if fails on first, stamp head then upgrade)
docker exec kb-api sh -c 'FLASK_APP=wsgi.py flask db upgrade || (FLASK_APP=wsgi.py flask db stamp head && FLASK_APP=wsgi.py flask db upgrade)'
# Initialize new filter structure (idempotent)
docker exec kb-api sh -c 'python init_filters.py || true'
# Frontend build
cd bz-front-development
export VITE_API_URL="/api"
if [ -f "$HOME/.nvm/nvm.sh" ]; then . "$HOME/.nvm/nvm.sh"; fi
if command -v nvm >/dev/null 2>&1; then nvm install 20 >/dev/null 2>&1 || true; nvm use 20 >/dev/null 2>&1 || true; fi
npm ci || npm install
npm run build:ci
nginx -t && systemctl reload nginx
"""

print('> running remote deploy steps...')
stdin, stdout, stderr = client.exec_command(remote_script)
exit_status = stdout.channel.recv_exit_status()
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))
client.close()
print('> done')


