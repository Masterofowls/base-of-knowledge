#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pytest
import json

class TestDataRetrieval:
    """Тесты для получения данных из API."""
    
    @pytest.mark.data
    def test_articles_endpoint(self, client):
        """Тест получения списка статей."""
        response = client.get('/api/articles')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'articles' in data
        assert 'pagination' in data
        assert isinstance(data['articles'], list)
        
        # Проверяем структуру пагинации
        pagination = data['pagination']
        assert 'page' in pagination
        assert 'pages' in pagination
        assert 'per_page' in pagination
        assert 'total' in pagination
    
    @pytest.mark.data
    def test_articles_with_pagination(self, client):
        """Тест пагинации статей."""
        response = client.get('/api/articles?page=1&per_page=5')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['pagination']['per_page'] == 5
        assert data['pagination']['page'] == 1
    
    @pytest.mark.data
    def test_categories_endpoint(self, client):
        """Тест получения категорий."""
        response = client.get('/api/categories/top-categories')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
    
    @pytest.mark.data
    def test_cities_endpoint(self, client):
        """Тест получения городов."""
        response = client.get('/api/categories/cities')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) >= 3  # У нас есть 3 города в тестовых данных
        
        # Проверяем, что есть ожидаемые города
        city_names = [city['name'] for city in data]
        assert 'Москва' in city_names
        assert 'Санкт-Петербург' in city_names
        assert 'Казань' in city_names
    
    @pytest.mark.data
    def test_groups_endpoint(self, client):
        """Тест получения групп."""
        response = client.get('/api/categories/groups')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
    
    @pytest.mark.data
    def test_specialities_endpoint(self, client):
        """Тест получения специальностей."""
        response = client.get('/api/categories/specialities')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) >= 2  # У нас есть 2 специальности в тестовых данных
        
        # Проверяем структуру специальности
        if data:
            spec = data[0]
            assert 'id' in spec
            assert 'code' in spec
            assert 'name' in spec
            assert 'institution_type_id' in spec
    
    @pytest.mark.data
    def test_specialities_with_filter(self, client):
        """Тест фильтрации специальностей по типу учреждения."""
        response = client.get('/api/categories/specialities?institution_type_id=1')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        
        # Все специальности должны относиться к указанному типу учреждения
        for spec in data:
            assert spec['institution_type_id'] == 1
    
    @pytest.mark.data
    def test_education_forms_endpoint(self, client):
        """Тест получения форм обучения."""
        response = client.get('/api/categories/education-forms')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) >= 2  # У нас есть 2 формы обучения
        
        # Проверяем наличие ожидаемых форм обучения
        form_names = [form['name'] for form in data]
        assert 'Очная' in form_names
        assert 'Заочная' in form_names
    
    @pytest.mark.data
    def test_admission_years_endpoint(self, client):
        """Тест получения годов поступления."""
        response = client.get('/api/categories/admission-years')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) >= 2  # У нас есть 2 года поступления
        
        # Проверяем структуру
        if data:
            year = data[0]
            assert 'id' in year
            assert 'year' in year
    
    @pytest.mark.data
    def test_institution_types_endpoint(self, client):
        """Тест получения типов учреждений."""
        response = client.get('/api/categories/institution-types')
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) >= 3  # У нас есть 3 типа учреждений
        
        # Проверяем наличие ожидаемых типов
        type_names = [inst_type['name'] for inst_type in data]
        assert 'Колледж' in type_names
        assert 'Вуз' in type_names
        assert 'Школа' in type_names

class TestHealthCheck:
    """Тесты для проверки работоспособности API."""
    
    def test_health_check_endpoint(self, client):
        """Тест health check endpoint."""
        response = client.get('/')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'ok'
        assert data['app'] == 'knowledge-base'
        assert 'version' in data
    
    def test_invalid_endpoint(self, client):
        """Тест несуществующего endpoint."""
        response = client.get('/api/nonexistent')
        
        assert response.status_code == 404
