#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Скрипт для запуска автотестов Knowledge Base API
"""

import subprocess
import sys
import os
import argparse

def run_command(command, description):
    """Запуск команды с описанием."""
    print(f"\n{'='*50}")
    print(f"🚀 {description}")
    print(f"{'='*50}")
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("Warnings:", result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Ошибка: {e}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Запуск автотестов для Knowledge Base API')
    parser.add_argument('--auth', action='store_true', help='Запустить только тесты аутентификации')
    parser.add_argument('--data', action='store_true', help='Запустить только тесты получения данных')
    parser.add_argument('--posts', action='store_true', help='Запустить только тесты управления постами')
    parser.add_argument('--integration', action='store_true', help='Запустить только интеграционные тесты')
    parser.add_argument('--verbose', '-v', action='store_true', help='Подробный вывод')
    parser.add_argument('--coverage', action='store_true', help='Запустить с покрытием кода')
    parser.add_argument('--install', action='store_true', help='Установить зависимости для тестирования')
    
    args = parser.parse_args()
    
    # Установка зависимостей
    if args.install:
        if not run_command('pip install pytest pytest-flask requests pytest-cov', 
                          'Установка зависимостей для тестирования'):
            return 1
    
    # Базовая команда pytest
    pytest_cmd = 'pytest'
    
    # Добавляем флаги
    if args.verbose:
        pytest_cmd += ' -v -s'
    
    if args.coverage:
        pytest_cmd += ' --cov=app --cov-report=html --cov-report=term'
    
    # Определяем какие тесты запускать
    test_files = []
    if args.auth:
        test_files.append('tests/test_auth.py')
    if args.data:
        test_files.append('tests/test_data.py')
    if args.posts:
        test_files.append('tests/test_posts.py')
    if args.integration:
        test_files.append('tests/test_integration.py')
    
    # Если не указаны конкретные тесты, запускаем все
    if not test_files:
        test_files = ['tests/']
    
    pytest_cmd += ' ' + ' '.join(test_files)
    
    print("🧪 Запуск автотестов Knowledge Base API")
    print(f"Команда: {pytest_cmd}")
    
    # Запуск тестов
    success = run_command(pytest_cmd, 'Выполнение тестов')
    
    if success:
        print("\n✅ Все тесты успешно выполнены!")
        if args.coverage:
            print("📊 Отчет о покрытии кода сохранен в htmlcov/index.html")
        return 0
    else:
        print("\n❌ Некоторые тесты завершились с ошибками")
        return 1

if __name__ == '__main__':
    sys.exit(main())
