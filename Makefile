# Makefile for Knowledge Base Project

.PHONY: test test-auth test-data test-posts test-integration test-verbose install-deps setup-test-env run-server help

# Активация виртуального окружения (для Windows)
VENV = .\.venv\Scripts\Activate.ps1

help:
	@echo "Available commands:"
	@echo "  install-deps     - Install testing dependencies"
	@echo "  test            - Run all tests"
	@echo "  test-auth       - Run authentication tests only"
	@echo "  test-data       - Run data retrieval tests only" 
	@echo "  test-posts      - Run post management tests only"
	@echo "  test-integration - Run integration tests only"
	@echo "  test-verbose    - Run all tests with verbose output"
	@echo "  setup-test-env  - Set up test environment"
	@echo "  run-server      - Start development server"

install-deps:
	pip install pytest pytest-flask requests

test:
	pytest

test-auth:
	pytest tests/test_auth.py -v

test-data:
	pytest tests/test_data.py -v

test-posts:
	pytest tests/test_posts.py -v

test-integration:
	pytest tests/test_integration.py -v

test-verbose:
	pytest -v -s

test-coverage:
	pytest --cov=app --cov-report=html --cov-report=term

setup-test-env:
	@echo "Setting up test environment..."
	pip install pytest pytest-flask requests pytest-cov
	@echo "Test environment ready!"

run-server:
	@echo "Starting development server..."
	python run.py

clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage
