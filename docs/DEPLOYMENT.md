# DEPLOYMENT (Ubuntu + Docker + Nginx)

Ниже — точные этапы, команды и настройки, которые реально сработали при деплое на один сервер: PostgreSQL (в Docker Compose), backend (Flask + Gunicorn в Docker), frontend (Vite/React + Nginx). Документация предназначена для локального репозитория.

## 0) Предусловия сервера

- Ubuntu 22.04 LTS
- Root SSH доступ

Установка Docker и плагина compose:
```bash
apt-get update
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
cat > /etc/apt/sources.list.d/docker.list <<EOF
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable
EOF
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
```

Опционально: swap 2ГБ, если сборка фронта падает по памяти:
```bash
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
swapon --show
```

---

## 1) База данных (PostgreSQL через Docker Compose)

Можно использовать `deploy/docker-compose.yml` и `deploy/env.example` (скопируйте как `.env` и задайте пароль), либо развернуть минимальный compose ниже:

```bash
mkdir -p /opt/kb/postgres && cd /opt/kb/postgres
cat > docker-compose.yml <<'YAML'
version: "3.9"
services:
  db:
    image: postgres:16
    container_name: kb-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: knowledge_base
      POSTGRES_USER: kb_user
      POSTGRES_PASSWORD: change_me_strong
    volumes:
      - ./data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kb_user -d knowledge_base"]
      interval: 10s
      timeout: 5s
      retries: 5
YAML

docker compose up -d
```

DSN:
- из backend-контейнера: `postgresql+psycopg2://kb_user:change_me_strong@kb-db:5432/knowledge_base`
- с хоста: `postgresql+psycopg2://kb_user:change_me_strong@127.0.0.1:5432/knowledge_base`

Проверка:
```bash
docker exec -it kb-db psql -U kb_user -d knowledge_base -c '\l'
```

---

## 2) Загрузка репозитория на сервер (только отслеживаемые файлы)

С локальной машины (Windows PowerShell):
```powershell
cd B:\base-of-knowledge
# чистый архив Git без .git и локального мусора
git archive --format=tar HEAD | ssh root@SERVER_IP "mkdir -p /opt/kb/app && tar -xf - -C /opt/kb/app"
```

---

## 3) Backend (Flask/Gunicorn в Docker)

Сборка образа:
```bash
cd /opt/kb/app
docker build -t kb-backend .
```

Запуск (хост 9000 → контейнер 8080):
```bash
docker rm -f kb-api 2>/dev/null || true

docker run -d --name kb-api --restart unless-stopped \
  --network postgres_default -p 9000:8080 \
  -e DATABASE_URL='postgresql+psycopg2://kb_user:change_me_strong@kb-db:5432/knowledge_base' \
  -e JWT_SECRET_KEY='change-me' \
  kb-backend
```

Если первичная миграция дала ошибку — пометить схему актуальной (однократно):
```bash
docker exec kb-api sh -c 'FLASK_APP=wsgi.py flask db stamp head'
```

Проверка API:
```bash
curl -sS http://127.0.0.1:9000/
```

---

## 4) Frontend (Vite/React) и Nginx

Node.js 20 через nvm:
```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
node -v
```

Сборка фронта с `VITE_API_URL="/api"`:
```bash
cd /opt/kb/app/bz-front-development
export VITE_API_URL="/api"
npm ci || npm install
npm run build:ci
```

Nginx-сайт:
```bash
apt-get install -y nginx
cat > /etc/nginx/sites-available/kb.conf <<'NGINX'
server {
    listen 80;
    server_name _;
    root /opt/kb/app/bz-front-development/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/kb.conf /etc/nginx/sites-enabled/kb.conf
nginx -t && systemctl reload nginx
```

Что помогло на практике:
- Если фронт ранее собран с двойным `/api` — временно добавить:
  ```nginx
  rewrite ^/api/api/(.*)$ /api/$1 last;
  ```
  (убрать после пересборки с правильным `VITE_API_URL`)
- Linux чувствителен к регистру импортов — исправить пути (`ItemList` vs `Itemlist`).
- OOM при сборке Node — добавить swap и использовать `npm run build:ci`.

---

## 5) Сид (минимальные данные, опционально)

Будут созданы роли, типы учреждений, города (Москва, Санкт-Петербург, Казань), группы, категории и тестовые пользователи. Пароли хешируются `Flask-Bcrypt` и сохраняются в `User.password`.

- Админ: `admin@example.com / Admin123!`
- Редактор: `editor@example.com / Editor123!`

```bash
docker exec -i kb-api python - <<'PY'
from app import create_app, db
from app.models import (
  Role, InstitutionType, EducationForm, AdmissionYear, SchoolClass, City, Speciality,
  Group, TopCategory, Subcategory, Category, User,
  Article, ArticleAuthor, ArticleCategory
)
from flask_bcrypt import generate_password_hash

app = create_app('production')
with app.app_context():
  def ensure(model, **kw):
    obj = model.query.filter_by(**kw).first()
    if obj: return obj
    obj = model(**kw); db.session.add(obj); db.session.commit(); return obj

  role_admin = ensure(Role, name="Администратор")
  role_editor = ensure(Role, name="Редактор")
  ensure(Role, name="Авторизованный читатель")
  ensure(Role, name="Гостевой читатель")

  it_college = ensure(InstitutionType, name="Колледж")
  it_univ    = ensure(InstitutionType, name="Вуз")
  it_school  = ensure(InstitutionType, name="Школа")

  city_msk = ensure(City, name="Москва")
  city_spb = ensure(City, name="Санкт-Петербург")
  city_kzn = ensure(City, name="Казань")

  ef_c_ft = ensure(EducationForm, name="Очная", institution_type_id=it_college.id)
  ef_c_dt = ensure(EducationForm, name="Заочная", institution_type_id=it_college.id)
  ef_u_ft = ensure(EducationForm, name="Очная", institution_type_id=it_univ.id)

  ay24_c = ensure(AdmissionYear, year=2024, institution_type_id=it_college.id)
  ay25_c = ensure(AdmissionYear, year=2025, institution_type_id=it_college.id)
  ay24_u = ensure(AdmissionYear, year=2024, institution_type_id=it_univ.id)

  sc9  = ensure(SchoolClass, name="9",  institution_type_id=it_school.id)
  sc11 = ensure(SchoolClass, name="11", institution_type_id=it_school.id)

  spec_it = ensure(Speciality, code="09.01", name="Информатика", institution_type_id=it_college.id)
  spec_dg = ensure(Speciality, code="54.01", name="Дизайн",      institution_type_id=it_college.id)
  spec_ma = ensure(Speciality, code="01.03", name="Математика",  institution_type_id=it_univ.id)

  def ensure_group(name, **kw):
    g = Group.query.filter_by(display_name=name).first()
    if g: return g
    g = Group(display_name=name, **kw); db.session.add(g); db.session.commit(); return g

  g_it101 = ensure_group("ИТ-101", speciality_id=spec_it.id, education_form_id=ef_c_ft.id, admission_year_id=ay24_c.id, institution_type_id=it_college.id, city_id=city_msk.id)
  g_des201= ensure_group("ДЗ-201", speciality_id=spec_dg.id, education_form_id=ef_c_dt.id, admission_year_id=ay25_c.id, institution_type_id=it_college.id, city_id=city_spb.id)
  g_uni1  = ensure_group("ФИИТ-1", speciality_id=spec_ma.id, education_form_id=ef_u_ft.id, admission_year_id=ay24_u.id, institution_type_id=it_univ.id, city_id=city_kzn.id)
  g_9a    = ensure_group("9А", speciality_id=spec_it.id, education_form_id=ef_c_ft.id, admission_year_id=ay24_c.id, institution_type_id=it_school.id, school_class_id=sc9.id, city_id=city_spb.id)

  top_news = ensure(TopCategory, slug="novosti", name="Новости")
  top_ann  = ensure(TopCategory, slug="obyavleniya", name="Объявления")

  sub_common = ensure(Subcategory, top_category_id=top_news.id, slug="obshchee", name="Общее")
  sub_study  = ensure(Subcategory, top_category_id=top_ann.id,  slug="ucheba",  name="Учёба")

  def ensure_cat(t, s, g):
    c = Category.query.filter_by(top_category_id=t, subcategory_id=s, group_id=g).first()
    return c or ensure(Category, top_category_id=t, subcategory_id=s, group_id=g)

  c_it101  = ensure_cat(top_news.id, sub_common.id, g_it101.id)
  c_des201 = ensure_cat(top_news.id, sub_common.id, g_des201.id)
  c_uni1   = ensure_cat(top_ann.id,  sub_study.id,  g_uni1.id)

  def ensure_user(email, name, role, pwd):
    u = User.query.filter_by(email=email).first()
    if u: return u
    pw = generate_password_hash(pwd).decode()
    u = User(email=email, full_name=name, password=pw, role_id=role.id)
    db.session.add(u); db.session.commit(); return u

  admin  = ensure_user("admin@example.com",  "Администратор", role_admin, "Admin123!")
  editor = ensure_user("editor@example.com", "Редактор",     role_editor, "Editor123!")

  def ensure_post(title, content, author_user, cat, **kw):
    a = Article.query.filter_by(title=title).first()
    if a: return a
    a = Article(title=title, content=content, is_published=True, is_actual=True, **kw)
    db.session.add(a); db.session.commit()
    db.session.add(ArticleAuthor(article_id=a.id, user_id=author_user.id))
    db.session.add(ArticleCategory(article_id=a.id, category_id=cat.id))
    db.session.commit(); return a

  ensure_post("Добро пожаловать (для всех)", "Пост доступен всем пользователям.", admin,  c_it101, audience='all')
  ensure_post("События Санкт-Петербурга",     "Новость по городу СПб.",         editor, c_des201, audience='city', audience_city_id=city_spb.id)
  ensure_post("Информация для 1 курса",       "Сообщение для студентов 1 курса.", admin,  c_uni1,  audience='course', audience_course=1)

  print("Seed complete")
PY
```

---

## 6) Обновления / Редеплой

```bash
cd B:\base-of-knowledge
git add -A && git commit -m "deploy: update"
git archive --format=tar HEAD | ssh root@SERVER_IP 'tar -xf - -C /opt/kb/app'
```

Фронтенд:
```bash
cd /opt/kb/app/bz-front-development
export VITE_API_URL="/api"
npm ci || npm install
npm run build:ci
nginx -t && systemctl reload nginx
```

Бэкенд (если менялись Python-файлы):
```bash
cd /opt/kb/app
docker build -t kb-backend .
docker rm -f kb-api
# запуск — см. раздел 3
```

---

## 7) Health checks

```bash
curl -I http://127.0.0.1/               # фронтенд
curl -sS http://127.0.0.1/api/articles/ # пример API
```

---

## 8) Быстрый troubleshooting (что реально помогло)

- Порты 8080/8081 заняты → публиковать backend на 9000 (`-p 9000:8080`).
- Ошибка миграций при первом запуске → `flask db stamp head`.
- База URL API на фронте → `VITE_API_URL="/api"` + Nginx `/api/`.
- Двойной `/api/api` → временный rewrite и пересборка фронта без дублирования.
- Регистр путей в Linux → поправить импорты под верный регистр.
- Недостаток памяти при сборке → добавить swap и использовать `build:ci`.

