# Система базы знаний


## Возможности

- **Пользователи и роли**: Администратор, Редактор, Авторизованный читатель, Гость
- **Статьи**: создание, чтение, обновление, удаление; богатое содержимое
- **Категории**: иерархия верхних категорий и подкатегорий, привязка к группам
- **Мультимедиа**: загрузка и управление изображениями/видео/документами
- **Поиск и фильтры**: расширенные параметры фильтрации
- **REST API**: для интеграции фронтенда

## Требования

- Python 3.8+
- PostgreSQL 14+ (или совместимая)
- pip

## Установка (Backend)

1) Клонирование репозитория
   ```bash
   git clone <repository-url>
cd base-of-knowledge
   ```

2) Виртуальное окружение
   ```bash
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
```

3) Установка зависимостей
   ```bash
   pip install -r requirements.txt
   ```

4) Переменные окружения (файл `.env` в корне)
   ```env
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost/knowledge_base
   JWT_SECRET_KEY=your-secret-key-here
   FLASK_ENV=development
   FLASK_DEBUG=True
   ```

5) Создание базы данных (PostgreSQL)
   ```sql
CREATE DATABASE knowledge_base;
   ```

6) Запуск приложения
   ```bash
   python run.py
   ```

## Миграции базы данных (Backend)

Проект использует Flask-Migrate (Alembic). Перед выполнением команд убедитесь, что указана точка входа Flask.

Windows PowerShell (PostgreSQL):
```powershell
$env:FLASK_APP="wsgi.py"
$env:DATABASE_URL="postgresql+psycopg2://postgres:password@localhost/knowledge_base"
flask db init     # однократно, создаёт папку migrations
flask db migrate -m "init"
flask db upgrade
```

Linux/macOS (PostgreSQL):
```bash
export FLASK_APP=wsgi.py
export DATABASE_URL=postgresql+psycopg2://postgres:password@localhost/knowledge_base
flask db init     # однократно
flask db migrate -m "init"
flask db upgrade
```

- Для последующих изменений моделей повторяйте: `flask db migrate -m "msg" && flask db upgrade`.
- Если переменная `DATABASE_URL` не задана, приложение используется SQLite (`sqlite:///data.db`) как резерв для локального демо.

## Фронтенд

Фронтенд (Vite + React + TypeScript) расположен в `bz-front-development/`.

Быстрый старт:
```bash
cd bz-front-development
npm install
npm run dev
```

Конфигурация API:
```env
VITE_API_URL=http://localhost:5000
```

Сборка:
```bash
npm run build
```

Примечание по миграциям фронтенда: у фронтенда нет собственной БД и, соответственно, миграций. Все миграции относятся к backend.

## Docker (Backend)

В репозитории есть `Dockerfile` для сборки backend-образа.

1) Сборка образа:
```bash
docker build -t kb-backend .
```

2) Запуск с локальной PostgreSQL (host):
- Windows/Mac: используйте `host.docker.internal` для доступа к хосту.
```bash
docker run --name kb-api --rm -p 8080:8080 \
  -e JWT_SECRET_KEY=change-me \
  -e DATABASE_URL=postgresql+psycopg2://postgres:password@host.docker.internal:5432/knowledge_base \
  kb-backend
```

3) Запуск с PostgreSQL в Docker:
```bash
docker network create kb-net
docker run -d --name kb-db --network kb-net -p 5432:5432 \
  -e POSTGRES_PASSWORD=password -e POSTGRES_DB=knowledge_base postgres:16

docker run -d --name kb-api --network kb-net -p 8080:8080 \
  -e JWT_SECRET_KEY=change-me \
  -e DATABASE_URL=postgresql+psycopg2://postgres:password@kb-db:5432/knowledge_base \
  kb-backend

# применить миграции внутри контейнера API (один раз)
docker exec kb-api sh -c 'FLASK_APP=wsgi.py flask db upgrade'
```

По умолчанию сервер слушает `0.0.0.0:8080` (см. `Dockerfile`).

## Подключение фронтенда к бэкенду

Локальная разработка (Vite): укажите URL backend API в переменной `VITE_API_URL`.

- PowerShell (в текущей сессии):
```powershell
$env:VITE_API_URL="http://localhost:8080"
cd bz-front-development
npm run dev
```

- Файл `.env.local` в `bz-front-development/`:
```dotenv
VITE_API_URL=http://localhost:8080
```
Перезапустите `npm run dev` после изменения `.env.local`.

## Деплой

### Backend на Fly.io

Требования: установлен `flyctl` и аккаунт Fly.

1) Логин:
```bash
fly auth login
```

2) Создание приложения (если ещё не создано):
```bash
fly apps create <app-name>
```

3) Секреты окружения (обязательно задайте ваш DSN PostgreSQL и секрет JWT):
```bash
fly secrets set \
  DATABASE_URL=postgresql+psycopg2://<user>:<pass>@<host>:5432/<db> \
  JWT_SECRET_KEY=<change-me>
```

4) Деплой:
```bash
fly deploy
```

5) Применить миграции в прод:
```bash
fly ssh console -C "FLASK_APP=wsgi.py flask db upgrade"
```

6) Масштабирование (по желанию):
```bash
fly scale count 2
```

Адрес бэкенда будет доступен по `<app-name>.fly.dev` (или вашему домену). 

### Backend на Render (альтернатива)

1) Поднимите сервис через Docker (Render автоматически соберёт образ):
- Репозиторий подключается в Render; тип — Web Service; Runtime — Docker.

2) Переменные окружения:
- `DATABASE_URL` — PostgreSQL DSN
- `JWT_SECRET_KEY` — секрет JWT

3) После деплоя примените миграции:
```bash
# через Shell в панели Render
FLASK_APP=wsgi.py flask db upgrade
```

### База данных (Neon)

Рекомендуется управляемая PostgreSQL (например, Neon). В панели Neon создайте проект/базу, получите строку подключения и задайте её в `DATABASE_URL`.

Пример формата DSN:
```
postgresql+psycopg2://<user>:<password>@<host>:5432/<db>
```

### Frontend на Netlify

Через UI (рекомендуется):
1) New site from Git > выберите репозиторий
2) Base directory: `bz-front-development`
3) Build command: автоконфиг из `netlify.toml` (или `npm run build`)
4) Publish directory: `dist`
5) В разделе Environment variables добавьте `VITE_API_URL=https://<app-name>.fly.dev` (или ваш домен)

CLI-вариант:
```bash
cd bz-front-development
npm i -g netlify-cli
netlify init        # если сайт ещё не связан
netlify env:set VITE_API_URL https://<app-name>.fly.dev
netlify deploy --build --prod
```

## Основные API-эндпоинты

### Аутентификация
- `POST /api/auth/login` — вход
- `POST /api/auth/register` — регистрация
- `GET /api/auth/profile` — профиль
- `PUT /api/auth/profile` — обновление профиля
- `POST /api/auth/reset-password` — сброс пароля
- `POST /api/auth/change-password` — смена пароля

### Статьи
- `GET /api/articles/` — список статей с фильтрами
- `GET /api/articles/<id>` — конкретная статья
- `POST /api/articles/` — создать статью
- `PUT /api/articles/<id>` — обновить статью
- `DELETE /api/articles/<id>` — удалить статью
- `POST /api/articles/<id>/publish` — опубликовать
- `POST /api/articles/<id>/unpublish` — снять с публикации

### Категории и группы
- `GET /api/categories/top-categories` — верхние категории
- `POST /api/categories/top-categories` — создать верхнюю категорию
- `PUT /api/categories/top-categories/<id>` — обновить верхнюю категорию
- `DELETE /api/categories/top-categories/<id>` — удалить верхнюю категорию
- `GET /api/categories/subcategories` — подкатегории
- `POST /api/categories/subcategories` — создать подкатегорию
- `PUT /api/categories/subcategories/<id>` — обновить подкатегорию
- `DELETE /api/categories/subcategories/<id>` — удалить подкатегорию
- `GET /api/categories/groups` — группы (с фильтрами)
- `POST /api/categories/groups` — создать группу (админ)

### Пользователи (только админ)
- `GET /api/users/` — список пользователей
- `POST /api/users/` — создать пользователя
- `GET /api/users/<id>` — пользователь
- `PUT /api/users/<id>` — обновить
- `DELETE /api/users/<id>` — удалить
- `POST /api/users/<id>/reset-password` — сброс пароля
- `GET /api/users/roles` — роли
- `POST /api/users/bulk-import` — массовый импорт из CSV

### Медиа
- `POST /api/media/upload` — загрузка файла
- `GET /api/media/<id>` — получить файл
- `DELETE /api/media/<id>` — удалить файл
- `GET /api/media/article/<id>/media` — медиа статьи
- `POST /api/media/article/<id>/media` — добавить медиа к статье
- `DELETE /api/media/article/<id>/media/<media_id>` — удалить медиа из статьи
- `PUT /api/media/article/<id>/media/<media_id>` — позиция медиа

