# 🧪 Автотесты Knowledge Base API

Этот документ описывает автотесты для API Knowledge Base системы, созданные с использованием pytest и Flask-testing.

## 📋 Содержание

- [Установка зависимостей](#установка-зависимостей)
- [Структура тестов](#структура-тестов)
- [Запуск тестов](#запуск-тестов)
- [Описание тестов](#описание-тестов)
- [Покрытие кода](#покрытие-кода)

## 🚀 Установка зависимостей

```bash
# Активация виртуального окружения
.\.venv\Scripts\Activate.ps1

# Установка зависимостей для тестирования
pip install pytest pytest-flask requests pytest-cov

# Или используя скрипт
python run_tests.py --install
```

## 📁 Структура тестов

```
tests/
├── __init__.py
├── conftest.py                 # Конфигурация тестов и фикстуры
├── test_auth.py               # Тесты аутентификации
├── test_data.py               # Тесты получения данных
├── test_posts.py              # Тесты управления постами
└── test_integration.py        # Интеграционные тесты
```

## 🏃‍♂️ Запуск тестов

### Все тесты
```bash
pytest
# или
python run_tests.py
```

### Конкретные группы тестов
```bash
# Тесты аутентификации
pytest tests/test_auth.py -v
python run_tests.py --auth

# Тесты данных
pytest tests/test_data.py -v
python run_tests.py --data

# Тесты постов
pytest tests/test_posts.py -v
python run_tests.py --posts

# Интеграционные тесты
pytest tests/test_integration.py -v
python run_tests.py --integration
```

### С подробным выводом
```bash
pytest -v -s
python run_tests.py --verbose
```

### С покрытием кода
```bash
pytest --cov=app --cov-report=html --cov-report=term
python run_tests.py --coverage
```

## 📊 Описание тестов

### 🔐 Тесты аутентификации (`test_auth.py`)

**TestAuthentication**
- `test_admin_login_success` - Успешный вход администратора
- `test_admin_login_wrong_password` - Неверный пароль
- `test_admin_login_nonexistent_user` - Несуществующий пользователь
- `test_admin_login_missing_credentials` - Отсутствующие данные
- `test_editor_login_success` - Успешный вход редактора
- `test_get_profile_with_valid_token` - Получение профиля с токеном
- `test_get_profile_without_token` - Получение профиля без токена
- `test_get_profile_with_invalid_token` - Невалидный токен

**TestStudentFlow**
- `test_student_cities_access` - Доступ к городам для студентов
- `test_student_groups_access` - Доступ к группам
- `test_student_specialities_access` - Доступ к специальностям
- `test_student_education_forms_access` - Доступ к формам обучения

### 📊 Тесты данных (`test_data.py`)

**TestDataRetrieval**
- `test_articles_endpoint` - Получение списка статей
- `test_articles_with_pagination` - Пагинация статей
- `test_categories_endpoint` - Получение категорий
- `test_cities_endpoint` - Получение городов
- `test_groups_endpoint` - Получение групп
- `test_specialities_endpoint` - Получение специальностей
- `test_specialities_with_filter` - Фильтрация специальностей
- `test_education_forms_endpoint` - Формы обучения
- `test_admission_years_endpoint` - Годы поступления
- `test_institution_types_endpoint` - Типы учреждений

**TestHealthCheck**
- `test_health_check_endpoint` - Health check API
- `test_invalid_endpoint` - Несуществующий endpoint

### 📝 Тесты постов (`test_posts.py`)

**TestPostCreation**
- `test_create_article_as_admin` - Создание статьи администратором
- `test_create_article_as_editor` - Создание статьи редактором
- `test_create_article_without_auth` - Создание без авторизации
- `test_create_article_missing_title` - Создание без заголовка
- `test_create_article_missing_content` - Создание без содержимого

**TestPostPublishing**
- `test_publish_article_as_admin` - Публикация администратором
- `test_unpublish_article_as_admin` - Снятие с публикации
- `test_publish_nonexistent_article` - Публикация несуществующей статьи
- `test_publish_article_without_auth` - Публикация без авторизации

**TestPostManagement**
- `test_get_article_by_id` - Получение статьи по ID
- `test_update_article_as_admin` - Обновление статьи
- `test_delete_article_as_admin` - Удаление статьи
- `test_filter_articles_by_published_status` - Фильтрация по статусу

### 🔄 Интеграционные тесты (`test_integration.py`)

**TestIntegrationFlows**
- `test_complete_admin_workflow` - Полный workflow администратора
- `test_student_data_access_workflow` - Workflow доступа студентов к данным
- `test_editor_workflow` - Workflow редактора
- `test_unauthorized_access_restrictions` - Ограничения доступа
- `test_data_consistency` - Согласованность данных

## 🎯 Тестовые данные

Тесты используют изолированную in-memory SQLite базу данных с предзаполненными тестовыми данными:

- **Пользователи**:
  - Админ: `admin@test.com` / `Admin123!`
  - Редактор: `editor@test.com` / `Editor123!`

- **Города**: Москва, Санкт-Петербург, Казань
- **Специальности**: ИТ, Экономика
- **Формы обучения**: Очная, Заочная
- **Годы поступления**: 2023, 2024

## 📈 Покрытие кода

После запуска тестов с покрытием (`--coverage`), отчет сохраняется в:
- Консольный отчет: выводится в терминал
- HTML отчет: `htmlcov/index.html`

## 🐛 Отладка тестов

Для подробной отладки используйте:
```bash
pytest -v -s --tb=short
python run_tests.py --verbose
```

Флаги:
- `-v` - подробный вывод
- `-s` - показать print() в тестах
- `--tb=short` - короткие traceback

## ⚙️ Конфигурация

Конфигурация тестов находится в `conftest.py`:
- Создание тестового приложения
- Настройка тестовой базы данных
- Предзаполнение тестовыми данными
- Фикстуры для токенов аутентификации

## 📝 Добавление новых тестов

1. Создайте новый файл `test_*.py` в папке `tests/`
2. Импортируйте необходимые фикстуры из `conftest.py`
3. Используйте маркеры pytest для группировки:
   - `@pytest.mark.auth` - для тестов аутентификации
   - `@pytest.mark.data` - для тестов данных
   - `@pytest.mark.posts` - для тестов постов
   - `@pytest.mark.integration` - для интеграционных тестов

Пример:
```python
import pytest

class TestNewFeature:
    @pytest.mark.data
    def test_new_endpoint(self, client):
        response = client.get('/api/new-endpoint')
        assert response.status_code == 200
```

## 🚦 CI/CD

Тесты готовы для интеграции в CI/CD пайплайн. Используйте:
```bash
python run_tests.py --coverage
```

Или для быстрой проверки:
```bash
pytest --tb=short
```
