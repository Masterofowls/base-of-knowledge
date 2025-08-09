#!/usr/bin/env python3
"""
Simple test script to verify API endpoints are working correctly.
This script tests the basic functionality of the Knowledge Base System API.
"""

import requests
import json

# Configuration
BASE_URL = 'http://localhost:5000/api'
ADMIN_EMAIL = 'admin@example.com'
ADMIN_PASSWORD = 'Admin123!'

def test_auth():
    """Test authentication endpoints"""
    print("Testing authentication...")
    
    # Test login
    login_data = {
        'email': ADMIN_EMAIL,
        'password': ADMIN_PASSWORD
    }
    
    response = requests.post(f'{BASE_URL}/auth/login', json=login_data)
    if response.status_code == 200:
        token = response.json()['access_token']
        print("✓ Login successful")
        return token
    else:
        print(f"✗ Login failed: {response.status_code} - {response.text}")
        return None

def test_articles(token):
    """Test article endpoints"""
    print("\nTesting articles...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test get articles
    response = requests.get(f'{BASE_URL}/articles/', headers=headers)
    if response.status_code == 200:
        print("✓ Get articles successful")
    else:
        print(f"✗ Get articles failed: {response.status_code} - {response.text}")
    
    # Test create article
    article_data = {
        'title': 'Test Article',
        'content': 'This is a test article content.',
        'is_published': True,
        'is_for_staff': False,
        'is_actual': True,
        'category_ids': []
    }
    
    response = requests.post(f'{BASE_URL}/articles/', json=article_data, headers=headers)
    if response.status_code == 201:
        article_id = response.json()['id']
        print("✓ Create article successful")
        
        # Test get specific article
        response = requests.get(f'{BASE_URL}/articles/{article_id}', headers=headers)
        if response.status_code == 200:
            print("✓ Get specific article successful")
        else:
            print(f"✗ Get specific article failed: {response.status_code} - {response.text}")
        
        return article_id
    else:
        print(f"✗ Create article failed: {response.status_code} - {response.text}")
        return None

def test_categories(token):
    """Test category endpoints"""
    print("\nTesting categories...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test get top categories
    response = requests.get(f'{BASE_URL}/categories/top-categories', headers=headers)
    if response.status_code == 200:
        print("✓ Get top categories successful")
        categories = response.json()
        if categories:
            print(f"  Found {len(categories)} top categories")
    else:
        print(f"✗ Get top categories failed: {response.status_code} - {response.text}")
    
    # Test get subcategories
    response = requests.get(f'{BASE_URL}/categories/subcategories', headers=headers)
    if response.status_code == 200:
        print("✓ Get subcategories successful")
        subcategories = response.json()
        if subcategories:
            print(f"  Found {len(subcategories)} subcategories")
    else:
        print(f"✗ Get subcategories failed: {response.status_code} - {response.text}")

def test_users(token):
    """Test user management endpoints"""
    print("\nTesting user management...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test get users
    response = requests.get(f'{BASE_URL}/users/', headers=headers)
    if response.status_code == 200:
        print("✓ Get users successful")
        users = response.json()['users']
        if users:
            print(f"  Found {len(users)} users")
    else:
        print(f"✗ Get users failed: {response.status_code} - {response.text}")
    
    # Test get roles
    response = requests.get(f'{BASE_URL}/users/roles', headers=headers)
    if response.status_code == 200:
        print("✓ Get roles successful")
        roles = response.json()
        if roles:
            print(f"  Found {len(roles)} roles")
    else:
        print(f"✗ Get roles failed: {response.status_code} - {response.text}")

def main():
    """Main test function"""
    print("🚀 Starting API tests...")
    print(f"Base URL: {BASE_URL}")
    
    # Test authentication
    token = test_auth()
    if not token:
        print("❌ Authentication failed. Cannot continue tests.")
        return
    
    # Test articles
    article_id = test_articles(token)
    
    # Test categories
    test_categories(token)
    
    # Test user management
    test_users(token)
    
    print("\n✅ All tests completed!")

if __name__ == '__main__':
    main()
