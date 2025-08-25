import os
import sys
import paramiko

SERVER = os.environ.get('KB_DEPLOY_SERVER', '89.169.44.175')
USER = os.environ.get('KB_DEPLOY_USER', 'root')
PASSWORD = os.environ.get('KB_DEPLOY_PASSWORD')
REMOTE_PATH = '/opt/kb/app'

if not PASSWORD:
    print('ERR: Set KB_DEPLOY_PASSWORD env var')
    sys.exit(2)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASSWORD, timeout=30)

commands = [
    "docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'",
    "docker logs --tail=200 kb-api || true",
    # Use python inside the container to make a request (curl may be missing)
    "docker exec kb-api sh -lc "
    "'python - <<PY\nimport sys,urllib.request\ntry:\n  r=urllib.request.urlopen(\"http://127.0.0.1:8080/api/articles?per_page=1\", timeout=5)\n  print(r.status); print(r.read().decode())\nexcept Exception as e:\n  print(\"ERR:\", e)\nPY' || true",
]

for cmd in commands:
    print(f"$ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    if out:
        print(out)
    if err:
        print(err)

client.close()
