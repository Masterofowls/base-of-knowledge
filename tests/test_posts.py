#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pytest
import json

class TestPostCreation:
    """Тесты для создания статей/постов."""
    
    @pytest.mark.posts
    def test_create_article_as_admin(self, client, admin_token):
        """Тест создания статьи администратором."""
        headers = {'Authorization': f'Bearer {admin_token}'}
        article_data = {
            'title': 'Тестовая статья',
            'content': 'Это содержимое тестовой статьи для проверки создания.',
            'top_category_id': None,  # Может быть None для общих статей
            'subcategory_id': None
        }
        
        response = client.post('/api/articles/', 
                             json=article_data, 
                             headers=headers)
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['title'] == article_data['title']
        assert data['content'] == article_data['content']
        assert data['is_published'] == False  # По умолчанию не опубликована
        assert 'id' in data
        assert 'created_at' in data
        assert 'author' in data
    
    @pytest.mark.posts
    def test_create_article_as_editor(self, client, editor_token):
        """Тест создания статьи редактором."""
        headers = {'Authorization': f'Bearer {editor_token}'}
        article_data = {
            'title': 'Статья редактора',
            'content': 'Содержимое статьи от редактора.',
        }
        
        response = client.post('/api/articles/', 
                             json=article_data, 
                             headers=headers)
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['title'] == article_data['title']
        assert data['author']['role'] == 'Редактор'
    
    @pytest.mark.posts
    def test_create_article_without_auth(self, client):
        """Тест создания статьи без авторизации."""
        article_data = {
            'title': 'Неавторизованная статья',
            'content': 'Это не должно сработать.',
        }
        
        response = client.post('/api/articles/', json=article_data)
        
        assert response.status_code == 401
    
    @pytest.mark.posts
    def test_create_article_missing_title(self, client, admin_token):
        """Тест создания статьи без заголовка."""
        headers = {'Authorization': f'Bearer {admin_token}'}
        article_data = {
            'content': 'Статья без заголовка.',
        }
        
        response = client.post('/api/articles/', 
                             json=article_data, 
                             headers=headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    @pytest.mark.posts
    def test_create_article_missing_content(self, client, admin_token):
        """Тест создания статьи без содержимого."""
        headers = {'Authorization': f'Bearer {admin_token}'}
        article_data = {
            'title': 'Статья без содержимого',
        }
        
        response = client.post('/api/articles/', 
                             json=article_data, 
                             headers=headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data

class TestPostPublishing:
    """Тесты для публикации статей."""
    
    def create_test_article(self, client, token):
        """Вспомогательный метод для создания тестовой статьи."""
        headers = {'Authorization': f'Bearer {token}'}
        article_data = {
            'title': 'Статья для публикации',
            'content': 'Содержимое статьи для тестирования публикации.',
        }
        
        response = client.post('/api/articles/', 
                             json=article_data, 
                             headers=headers)
        return response.get_json()
    
    @pytest.mark.posts
    def test_publish_article_as_admin(self, client, admin_token):
        """Тест публикации статьи администратором."""
        # Создаем статью
        article = self.create_test_article(client, admin_token)
        article_id = article['id']
        
        # Публикуем статью
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.post(f'/api/articles/{article_id}/publish', 
                             headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Article published successfully'
        
        # Проверяем, что статья действительно опубликована
        response = client.get(f'/api/articles/{article_id}')
        assert response.status_code == 200
        article_data = response.get_json()
        assert article_data['is_published'] == True
    
    @pytest.mark.posts
    def test_unpublish_article_as_admin(self, client, admin_token):
        """Тест снятия с публикации статьи администратором."""
        # Создаем и публикуем статью
        article = self.create_test_article(client, admin_token)
        article_id = article['id']
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        
        # Публикуем
        client.post(f'/api/articles/{article_id}/publish', headers=headers)
        
        # Снимаем с публикации
        response = client.post(f'/api/articles/{article_id}/unpublish', 
                             headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Article unpublished successfully'
        
        # Проверяем статус
        response = client.get(f'/api/articles/{article_id}')
        assert response.status_code == 200
        article_data = response.get_json()
        assert article_data['is_published'] == False
    
    @pytest.mark.posts
    def test_publish_nonexistent_article(self, client, admin_token):
        """Тест публикации несуществующей статьи."""
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.post('/api/articles/99999/publish', 
                             headers=headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'error' in data
    
    @pytest.mark.posts
    def test_publish_article_without_auth(self, client):
        """Тест публикации статьи без авторизации."""
        response = client.post('/api/articles/1/publish')
        
        assert response.status_code == 401

class TestPostManagement:
    """Тесты для управления статьями."""
    
    def create_test_article(self, client, token):
        """Вспомогательный метод для создания тестовой статьи."""
        headers = {'Authorization': f'Bearer {token}'}
        article_data = {
            'title': 'Статья для управления',
            'content': 'Содержимое статьи для тестирования управления.',
        }
        
        response = client.post('/api/articles/', 
                             json=article_data, 
                             headers=headers)
        return response.get_json()
    
    @pytest.mark.posts
    def test_get_article_by_id(self, client, admin_token):
        """Тест получения статьи по ID."""
        # Создаем статью
        article = self.create_test_article(client, admin_token)
        article_id = article['id']
        
        # Получаем статью
        response = client.get(f'/api/articles/{article_id}')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['id'] == article_id
        assert data['title'] == 'Статья для управления'
    
    @pytest.mark.posts
    def test_update_article_as_admin(self, client, admin_token):
        """Тест обновления статьи администратором."""
        # Создаем статью
        article = self.create_test_article(client, admin_token)
        article_id = article['id']
        
        # Обновляем статью
        headers = {'Authorization': f'Bearer {admin_token}'}
        update_data = {
            'title': 'Обновленный заголовок',
            'content': 'Обновленное содержимое статьи.',
        }
        
        response = client.put(f'/api/articles/{article_id}', 
                            json=update_data, 
                            headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['title'] == update_data['title']
        assert data['content'] == update_data['content']
        assert 'updated_at' in data
    
    @pytest.mark.posts
    def test_delete_article_as_admin(self, client, admin_token):
        """Тест удаления статьи администратором."""
        # Создаем статью
        article = self.create_test_article(client, admin_token)
        article_id = article['id']
        
        # Удаляем статью
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.delete(f'/api/articles/{article_id}', 
                               headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Article deleted successfully'
        
        # Проверяем, что статья действительно удалена
        response = client.get(f'/api/articles/{article_id}')
        assert response.status_code == 404
    
    @pytest.mark.posts
    def test_filter_articles_by_published_status(self, client, admin_token):
        """Тест фильтрации статей по статусу публикации."""
        # Создаем и публикуем статью
        article = self.create_test_article(client, admin_token)
        article_id = article['id']
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        client.post(f'/api/articles/{article_id}/publish', headers=headers)
        
        # Получаем только опубликованные статьи
        response = client.get('/api/articles?is_published=true')
        
        assert response.status_code == 200
        data = response.get_json()
        
        # Проверяем, что все возвращенные статьи опубликованы
        for article in data['articles']:
            assert article['is_published'] == True
