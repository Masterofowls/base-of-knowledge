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
    # Create test groups and targeted posts; verify via student-feed
    "docker exec kb-api sh -lc 'python - <<PY\nfrom app import create_app\nfrom flask_jwt_extended import create_access_token\nimport urllib.request, json, time\nBASE = \"http://127.0.0.1:8080\"\napp = create_app()\nwith app.app_context():\n  try:\n    token = create_access_token(identity=\"2\")\n    ts = int(time.time())\n    headers = {\"Content-Type\":\"application/json\",\"Authorization\":f\"Bearer {token}\"}\n    def post(url, payload):\n      req = urllib.request.Request(url, data=json.dumps(payload).encode(\"utf-8\"), headers=headers, method=\"POST\")\n      return urllib.request.urlopen(req, timeout=8)\n    # Load dicts\n    try:\n      cities = json.loads(urllib.request.urlopen(f\"{BASE}/api/categories/cities\", timeout=8).read().decode())\n      forms = json.loads(urllib.request.urlopen(f\"{BASE}/api/categories/education-forms\", timeout=8).read().decode())\n      specs = json.loads(urllib.request.urlopen(f\"{BASE}/api/categories/specialities\", timeout=8).read().decode())\n      years = json.loads(urllib.request.urlopen(f\"{BASE}/api/categories/admission-years\", timeout=8).read().decode())\n      insts = json.loads(urllib.request.urlopen(f\"{BASE}/api/categories/institution-types\", timeout=8).read().decode())\n    except Exception as e:\n      print(\"dicts ERR:\", e); cities=forms=specs=years=insts=[]\n    # Create 3–5 groups across first cities\n    made_groups = []\n    if cities and forms and specs and years and insts:\n      form_id = forms[0].get(\"id\")\n      spec_id = specs[0].get(\"id\")\n      year_id = years[0].get(\"id\")\n      inst_id = insts[0].get(\"id\")\n      for city in cities[:5]:\n        payload = {\"display_name\": f\"TEST-GRP-{city.get('id')}-{ts}\", \"speciality_id\": spec_id, \"education_form_id\": form_id, \"admission_year_id\": year_id, \"city_id\": city.get('id'), \"institution_type_id\": inst_id}\n        try:\n          r = post(f\"{BASE}/api/categories/groups\", payload)\n          print(\"create group:\", r.status, r.read().decode())\n        except Exception as e:\n          print(\"create group ERR:\", e)\n        # Fetch groups list for the city to pick one id\n        try:\n          r = urllib.request.urlopen(f\"{BASE}/api/categories/groups?city_id={city.get('id')}\", timeout=8)\n          gl = json.loads(r.read().decode())\n          if gl:\n            made_groups.append(gl[0].get('id'))\n        except Exception as e:\n          print(\"list groups ERR:\", e)\n    # Create posts for multiple cities and courses\n    for ck in [\"nsk\",\"spb\",\"msk\"]:\n      try:\n        resp = post(f\"{BASE}/api/articles/\", {\"title\": f\"[TEST {ts}] City {ck.upper()}\", \"content\":f\"<p>city {ck}</p>\", \"is_published\": True, \"publish_scope\": {\"city_key\": ck}})\n        print(\"create city-targeted:\", ck, resp.status)\n      except Exception as e:\n        print(\"create city-targeted ERR:\", ck, e)\n    for crs in [1,2]:\n      try:\n        resp = post(f\"{BASE}/api/articles/\", {\"title\": f\"[TEST {ts}] Course {crs}\", \"content\":f\"<p>course {crs}</p>\", \"is_published\": True, \"publish_scope\": {\"course\": crs}})\n        print(\"create course-targeted:\", crs, resp.status)\n      except Exception as e:\n        print(\"create course-targeted ERR:\", crs, e)\n    # Verify student-feed for made groups\n    for gid in made_groups[:2]:\n      try:\n        r = urllib.request.urlopen(f\"{BASE}/api/articles/student-feed?group_id={gid}&course=1&per_page=5\", timeout=8)\n        print(\"student-feed\", gid, \"status:\", r.status)\n        print(r.read().decode())\n      except Exception as e:\n        print(\"student-feed ERR:\", e)\n  except Exception as e:\n    print(\"test-seq ERR:\", e)\nPY' || true",
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
