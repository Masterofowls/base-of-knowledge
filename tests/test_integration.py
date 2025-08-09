#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pytest
import json

class TestIntegrationFlows:
    """Интеграционные тесты для полных пользовательских сценариев."""
    
    @pytest.mark.integration
    def test_complete_admin_workflow(self, client):
        """Тест полного рабочего процесса администратора."""
        # 1. Вход в систему
        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'Admin123!'
        })
        assert login_response.status_code == 200
        token = login_response.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # 2. Получение профиля
        profile_response = client.get('/api/auth/profile', headers=headers)
        assert profile_response.status_code == 200
        assert profile_response.get_json()['role'] == 'Администратор'
        
        # 3. Создание статьи
        article_data = {
            'title': 'Интеграционная тестовая статья',
            'content': 'Содержимое для полного тестирования workflow.',
        }
        create_response = client.post('/api/articles/', 
                                    json=article_data, 
                                    headers=headers)
        assert create_response.status_code == 201
        article = create_response.get_json()
        article_id = article['id']
        
        # 4. Редактирование статьи
        update_data = {
            'title': 'Обновленная интеграционная статья',
            'content': 'Обновленное содержимое статьи.',
        }
        update_response = client.put(f'/api/articles/{article_id}', 
                                   json=update_data, 
                                   headers=headers)
        assert update_response.status_code == 200
        
        # 5. Публикация статьи
        publish_response = client.post(f'/api/articles/{article_id}/publish', 
                                     headers=headers)
        assert publish_response.status_code == 200
        
        # 6. Проверка публикации
        get_response = client.get(f'/api/articles/{article_id}')
        assert get_response.status_code == 200
        assert get_response.get_json()['is_published'] == True
        
        # 7. Снятие с публикации
        unpublish_response = client.post(f'/api/articles/{article_id}/unpublish', 
                                       headers=headers)
        assert unpublish_response.status_code == 200
        
        # 8. Удаление статьи
        delete_response = client.delete(f'/api/articles/{article_id}', 
                                      headers=headers)
        assert delete_response.status_code == 200
    
    @pytest.mark.integration
    def test_student_data_access_workflow(self, client):
        """Тест рабочего процесса доступа к данным для студентов."""
        # 1. Получение списка городов
        cities_response = client.get('/api/categories/cities')
        assert cities_response.status_code == 200
        cities = cities_response.get_json()
        assert len(cities) > 0
        
        # 2. Получение списка специальностей
        specialities_response = client.get('/api/categories/specialities')
        assert specialities_response.status_code == 200
        specialities = specialities_response.get_json()
        assert len(specialities) > 0
        
        # 3. Фильтрация специальностей по типу учреждения
        first_spec = specialities[0]
        institution_type_id = first_spec['institution_type_id']
        filtered_response = client.get(
            f'/api/categories/specialities?institution_type_id={institution_type_id}'
        )
        assert filtered_response.status_code == 200
        filtered_specs = filtered_response.get_json()
        
        # Все специальности должны относиться к выбранному типу
        for spec in filtered_specs:
            assert spec['institution_type_id'] == institution_type_id
        
        # 4. Получение форм обучения
        forms_response = client.get('/api/categories/education-forms')
        assert forms_response.status_code == 200
        forms = forms_response.get_json()
        assert len(forms) > 0
        
        # 5. Получение годов поступления
        years_response = client.get('/api/categories/admission-years')
        assert years_response.status_code == 200
        years = years_response.get_json()
        assert len(years) > 0
        
        # 6. Получение доступных статей (опубликованных)
        articles_response = client.get('/api/articles?is_published=true')
        assert articles_response.status_code == 200
        articles_data = articles_response.get_json()
        assert 'articles' in articles_data
        assert 'pagination' in articles_data
    
    @pytest.mark.integration
    def test_editor_workflow(self, client):
        """Тест рабочего процесса редактора."""
        # 1. Вход как редактор
        login_response = client.post('/api/auth/login', json={
            'email': 'editor@test.com',
            'password': 'Editor123!'
        })
        assert login_response.status_code == 200
        token = login_response.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # 2. Создание статьи
        article_data = {
            'title': 'Статья от редактора',
            'content': 'Содержимое статьи, созданной редактором.',
        }
        create_response = client.post('/api/articles/', 
                                    json=article_data, 
                                    headers=headers)
        assert create_response.status_code == 201
        article = create_response.get_json()
        article_id = article['id']
        
        # 3. Редактирование своей статьи
        update_data = {
            'title': 'Обновленная статья редактора',
            'content': 'Обновленное содержимое.',
        }
        update_response = client.put(f'/api/articles/{article_id}', 
                                   json=update_data, 
                                   headers=headers)
        assert update_response.status_code == 200
        
        # 4. Публикация статьи (если разрешено)
        publish_response = client.post(f'/api/articles/{article_id}/publish', 
                                     headers=headers)
        # Может быть 200 или 403 в зависимости от прав редактора
        assert publish_response.status_code in [200, 403]
    
    @pytest.mark.integration
    def test_unauthorized_access_restrictions(self, client):
        """Тест ограничений доступа для неавторизованных пользователей."""
        # 1. Попытка создания статьи без авторизации
        article_data = {
            'title': 'Неавторизованная статья',
            'content': 'Это не должно работать.',
        }
        create_response = client.post('/api/articles/', json=article_data)
        assert create_response.status_code == 401
        
        # 2. Попытка получения профиля без токена
        profile_response = client.get('/api/auth/profile')
        assert profile_response.status_code == 401
        
        # 3. Попытка управления пользователями без авторизации
        users_response = client.get('/api/users/')
        assert users_response.status_code == 401
        
        # 4. Доступ к публичным данным должен работать
        cities_response = client.get('/api/categories/cities')
        assert cities_response.status_code == 200
        
        articles_response = client.get('/api/articles')
        assert articles_response.status_code == 200
    
    @pytest.mark.integration
    def test_data_consistency(self, client, admin_token):
        """Тест согласованности данных в системе."""
        headers = {'Authorization': f'Bearer {admin_token}'}
        
        # 1. Создаем статью
        article_data = {
            'title': 'Тест согласованности данных',
            'content': 'Проверка согласованности данных в системе.',
        }
        create_response = client.post('/api/articles/', 
                                    json=article_data, 
                                    headers=headers)
        assert create_response.status_code == 201
        article = create_response.get_json()
        article_id = article['id']
        
        # 2. Проверяем, что статья появилась в списке
        list_response = client.get('/api/articles')
        assert list_response.status_code == 200
        articles = list_response.get_json()['articles']
        article_ids = [a['id'] for a in articles]
        assert article_id in article_ids
        
        # 3. Публикуем статью
        publish_response = client.post(f'/api/articles/{article_id}/publish', 
                                     headers=headers)
        assert publish_response.status_code == 200
        
        # 4. Проверяем согласованность статуса публикации
        get_response = client.get(f'/api/articles/{article_id}')
        assert get_response.status_code == 200
        assert get_response.get_json()['is_published'] == True
        
        # 5. Проверяем в списке опубликованных
        published_response = client.get('/api/articles?is_published=true')
        assert published_response.status_code == 200
        published_articles = published_response.get_json()['articles']
        published_ids = [a['id'] for a in published_articles]
        assert article_id in published_ids
        
        # 6. Очистка - удаляем статью
        delete_response = client.delete(f'/api/articles/{article_id}', 
                                      headers=headers)
        assert delete_response.status_code == 200
