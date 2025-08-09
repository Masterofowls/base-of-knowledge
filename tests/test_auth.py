#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pytest
import json

class TestAuthentication:
    """Тесты для аутентификации пользователей."""
    
    @pytest.mark.auth
    def test_admin_login_success(self, client):
        """Тест успешного входа администратора."""
        response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'Admin123!'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
        assert 'user' in data
        assert data['user']['email'] == 'admin@test.com'
        assert data['user']['role'] == 'Администратор'
    
    @pytest.mark.auth
    def test_admin_login_wrong_password(self, client):
        """Тест неуспешного входа администратора с неверным паролем."""
        response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
        assert 'Invalid email or password' in data['error']
    
    @pytest.mark.auth
    def test_admin_login_nonexistent_user(self, client):
        """Тест входа с несуществующим пользователем."""
        response = client.post('/api/auth/login', json={
            'email': 'nonexistent@test.com',
            'password': 'password123'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
    
    @pytest.mark.auth
    def test_admin_login_missing_credentials(self, client):
        """Тест входа без учетных данных."""
        response = client.post('/api/auth/login', json={})
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    @pytest.mark.auth
    def test_editor_login_success(self, client):
        """Тест успешного входа редактора."""
        response = client.post('/api/auth/login', json={
            'email': 'editor@test.com',
            'password': 'Editor123!'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
        assert 'user' in data
        assert data['user']['email'] == 'editor@test.com'
        assert data['user']['role'] == 'Редактор'
    
    @pytest.mark.auth
    def test_get_profile_with_valid_token(self, client, admin_token):
        """Тест получения профиля с валидным токеном."""
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/auth/profile', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['email'] == 'admin@test.com'
        assert data['full_name'] == 'Тестовый Администратор'
        assert data['role'] == 'Администратор'
    
    @pytest.mark.auth
    def test_get_profile_without_token(self, client):
        """Тест получения профиля без токена."""
        response = client.get('/api/auth/profile')
        
        assert response.status_code == 401
    
    @pytest.mark.auth
    def test_get_profile_with_invalid_token(self, client):
        """Тест получения профиля с невалидным токеном."""
        headers = {'Authorization': 'Bearer invalid_token'}
        response = client.get('/api/auth/profile', headers=headers)
        
        assert response.status_code == 422

class TestStudentFlow:
    """Тесты для потока входа студентов (без аутентификации)."""
    
    def test_student_cities_access(self, client):
        """Тест доступа к списку городов для студентов."""
        response = client.get('/api/categories/cities')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Проверяем структуру данных
        city = data[0]
        assert 'id' in city
        assert 'name' in city
    
    def test_student_groups_access(self, client):
        """Тест доступа к списку групп для студентов."""
        response = client.get('/api/categories/groups')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        # Может быть пустым в тестовой среде
    
    def test_student_specialities_access(self, client):
        """Тест доступа к специальностям для студентов."""
        response = client.get('/api/categories/specialities')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Проверяем структуру данных
        spec = data[0]
        assert 'id' in spec
        assert 'code' in spec
        assert 'name' in spec
    
    def test_student_education_forms_access(self, client):
        """Тест доступа к формам обучения для студентов."""
        response = client.get('/api/categories/education-forms')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Проверяем структуру данных
        form = data[0]
        assert 'id' in form
        assert 'name' in form
