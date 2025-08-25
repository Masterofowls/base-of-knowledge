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
    # Explicitly run startup migrations inside the container
    "docker exec kb-api sh -lc 'python - <<PY\nfrom app import create_app, db\nfrom app.db_migrations import run_startup_migrations\napp = create_app()\nwith app.app_context():\n  try:\n    run_startup_migrations(db)\n    print(\"startup migrations: OK\")\n  except Exception as e:\n    print(\"startup migrations: ERR\", e)\nPY' || true",
    # Use python inside the container to make a request (curl may be missing)
    "docker exec kb-api sh -lc "
    "'python - <<PY\nimport sys,urllib.request\ntry:\n  r=urllib.request.urlopen(\"http://127.0.0.1:8080/api/articles?per_page=1\", timeout=5)\n  print(r.status); print(r.read().decode())\nexcept Exception as e:\n  print(\"ERR:\", e)\nPY' || true",
    # Tail logs again to capture traceback
    "docker logs --tail=200 kb-api || true",
    # Create targeted test posts and verify visibility via endpoints
    "docker exec kb-api sh -lc 'python - <<PY\nfrom app import create_app\nfrom flask_jwt_extended import create_access_token\nimport urllib.request, json, time\nBASE = \"http://127.0.0.1:8080\"\napp = create_app()\nwith app.app_context():\n  try:\n    token = create_access_token(identity=\"2\")\n    ts = int(time.time())\n    headers = {\"Content-Type\":\"application/json\",\"Authorization\":f\"Bearer {token}\"}\n    # City-targeted post (nsk)\n    city_payload = {\"title\": f\"[TEST {ts}] City NSK\", \"content\":\"<p>city nsk</p>\", \"is_published\": True, \"publish_scope\": {\"city_key\": \"nsk\"}}\n    req = urllib.request.Request(f\"{BASE}/api/articles/\", data=json.dumps(city_payload).encode(\"utf-8\"), headers=headers, method=\"POST\")\n    try:\n      resp = urllib.request.urlopen(req, timeout=5)\n      print(\"create city-targeted:\", resp.status, resp.read().decode())\n    except Exception as e:\n      print(\"create city-targeted ERR:\", e)\n    # Course-targeted post (course 1)\n    course_payload = {\"title\": f\"[TEST {ts}] Course 1\", \"content\":\"<p>course 1</p>\", \"is_published\": True, \"publish_scope\": {\"course\": 1}}\n    req = urllib.request.Request(f\"{BASE}/api/articles/\", data=json.dumps(course_payload).encode(\"utf-8\"), headers=headers, method=\"POST\")\n    try:\n      resp = urllib.request.urlopen(req, timeout=5)\n      print(\"create course-targeted:\", resp.status, resp.read().decode())\n    except Exception as e:\n      print(\"create course-targeted ERR:\", e)\n    # Resolve Novosibirsk city id\n    try:\n      r = urllib.request.urlopen(f\"{BASE}/api/categories/cities\", timeout=5)\n      cities = json.loads(r.read().decode())\n      nsk = next((c for c in cities if c.get(\"name\",\"\")), None)\n      if nsk is None and cities:\n        nsk = cities[0]\n      city_id = nsk.get(\"id\") if nsk else None\n      print(\"nsk city_id:\", city_id)\n    except Exception as e:\n      city_id = None\n      print(\"cities ERR:\", e)\n    # Get a group by city (first)\n    group_id = None\n    try:\n      if city_id:\n        r = urllib.request.urlopen(f\"{BASE}/api/categories/groups?city_id={city_id}\", timeout=5)\n        groups = json.loads(r.read().decode())\n        if groups:\n          group_id = groups[0].get(\"id\")\n      print(\"group_id:\", group_id)\n    except Exception as e:\n      print(\"groups ERR:\", e)\n    # Check student feed\n    try:\n      if group_id:\n        r = urllib.request.urlopen(f\"{BASE}/api/articles/student-feed?group_id={group_id}&course=1&per_page=5\", timeout=5)\n        print(\"student-feed status:\", r.status)\n        print(r.read().decode())\n      else:\n        print(\"student-feed skip: no group_id\")\n    except Exception as e:\n      print(\"student-feed ERR:\", e)\n  except Exception as e:\n    print(\"test-seq ERR:\", e)\nPY' || true",
    "docker logs --tail=200 kb-api || true",
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
