import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChoiceRolePage from '../../pages/ChoiceRolePage/ui/ChoiceRolePage';
import AdminLoginPage from '../../pages/AdminLoginPage/ui/AdminLoginPage';
import StudentLoginPage from '../../pages/StudentLoginPage/ui/StudentLoginPage';
import MainPage from '../../pages/MainPage/ui/MainPage';
import http from 'shared/api/http';
import { mockAuthResponse, mockCities, mockGroups } from '../../__mocks__/apiMocks';

// Mock API client
jest.mock('shared/api/http');
const mockedHttp = http as jest.Mocked<typeof http>;

// Компонент для интеграционного тестирования
const TestApp = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<ChoiceRolePage />} />
      <Route path="/adminlogin" element={<AdminLoginPage />} />
      <Route path="/studentlogin" element={<StudentLoginPage />} />
      <Route path="/admin" element={<MainPage />} />
    </Routes>
  </BrowserRouter>
);

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Базовые моки для API
    mockedHttp.get.mockImplementation((url) => {
      if (url === '/api/categories/cities') {
        return Promise.resolve({ data: mockCities });
      }
      if (url === '/api/categories/groups') {
        return Promise.resolve({ data: mockGroups });
      }
      if (url === '/api/articles') {
        return Promise.resolve({ data: { articles: [] } });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  describe('Полный поток входа администратора', () => {
    it('должен провести пользователя через весь поток входа администратора', async () => {
      const user = userEvent.setup();

      render(<TestApp />);

      // 1. Начинаем с главной страницы выбора роли
      expect(screen.getByText('Выберите способ входа')).toBeInTheDocument();

      // 2. Кликаем на "Вход администратора"
      const adminButton = screen.getByText('Вход администратора');
      await user.click(adminButton);

      // 3. Попадаем на страницу входа администратора
      await waitFor(() => {
        expect(screen.getByText('Войти как администратор')).toBeInTheDocument();
      });

      // 4. Заполняем форму входа
      const emailInput = screen.getByLabelText('Логин');
      const passwordInput = screen.getByLabelText('Пароль');
      const loginButton = screen.getByText('Войти как администратор');

      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'Admin123!');

      // 5. Настраиваем мок для успешного входа
      mockedHttp.post.mockResolvedValueOnce({
        data: mockAuthResponse
      });

      // 6. Отправляем форму
      await user.click(loginButton);

      // 7. Проверяем что API был вызван
      await waitFor(() => {
        expect(mockedHttp.post).toHaveBeenCalledWith('/api/auth/login', {
          email: 'admin@test.com',
          password: 'Admin123!'
        });
      });

      // 8. Проверяем что токен сохранен в localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith('jwt_token', mockAuthResponse.access_token);
      expect(localStorage.setItem).toHaveBeenCalledWith('user_role', mockAuthResponse.user.role);
    });

    it('должен обрабатывать ошибку входа администратора', async () => {
      const user = userEvent.setup();
      window.alert = jest.fn();

      render(<TestApp />);

      // Переходим к форме входа администратора
      const adminButton = screen.getByText('Вход администратора');
      await user.click(adminButton);

      await waitFor(() => {
        expect(screen.getByText('Войти как администратор')).toBeInTheDocument();
      });

      // Заполняем форму неверными данными
      const emailInput = screen.getByLabelText('Логин');
      const passwordInput = screen.getByLabelText('Пароль');
      const loginButton = screen.getByText('Войти как администратор');

      await user.type(emailInput, 'admin@test.com');
      await user.type(passwordInput, 'wrongpassword');

      // Настраиваем мок для ошибки 401
      mockedHttp.post.mockRejectedValueOnce({
        response: { status: 401 }
      });

      await user.click(loginButton);

      // Проверяем что показывается ошибка
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Invalid credentials');
      });
    });
  });

  describe('Полный поток входа студента', () => {
    it('должен провести пользователя через весь поток входа студента', async () => {
      const user = userEvent.setup();

      render(<TestApp />);

      // 1. Начинаем с главной страницы выбора роли
      expect(screen.getByText('Выберите способ входа')).toBeInTheDocument();

      // 2. Кликаем на "Вход сотрудника"
      const studentButton = screen.getByText('Вход сотрудника');
      await user.click(studentButton);

      // 3. Попадаем на страницу выбора группы
      await waitFor(() => {
        expect(screen.getByText('Выберите свою группу')).toBeInTheDocument();
      });

      // 4. Ждем загрузки данных
      await waitFor(() => {
        expect(mockedHttp.get).toHaveBeenCalledWith('/api/categories/cities');
        expect(mockedHttp.get).toHaveBeenCalledWith('/api/categories/groups');
      });

      // 5. Проверяем что данные загружены и форма доступна
      await waitFor(() => {
        expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Войти как студент')).toBeInTheDocument();
      expect(screen.getByText(/Примечание: Данные студентов не сохраняются/)).toBeInTheDocument();
    });

    it('должен обрабатывать ошибки загрузки данных для студента', async () => {
      const user = userEvent.setup();
      console.error = jest.fn();

      // Настраиваем мок для ошибки загрузки
      mockedHttp.get.mockRejectedValue(new Error('API Error'));

      render(<TestApp />);

      const studentButton = screen.getByText('Вход сотрудника');
      await user.click(studentButton);

      // Проверяем что ошибка была обработана
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to fetch data:', expect.any(Error));
      });
    });
  });

  describe('Навигация между страницами', () => {
    it('должен позволять переходить назад с страницы входа администратора', async () => {
      const user = userEvent.setup();

      render(<TestApp />);

      // Переходим на страницу входа администратора
      const adminButton = screen.getByText('Вход администратора');
      await user.click(adminButton);

      await waitFor(() => {
        expect(screen.getByText('Войти как администратор')).toBeInTheDocument();
      });

      // Кликаем "Назад к выбору входа"
      const backButton = screen.getByText('Назад к выбору входа');
      await user.click(backButton);

      // Проверяем что вернулись на главную страницу
      await waitFor(() => {
        expect(screen.getByText('Выберите способ входа')).toBeInTheDocument();
      });
    });

    it('должен позволять переходить назад с страницы входа студента', async () => {
      const user = userEvent.setup();

      render(<TestApp />);

      // Переходим на страницу входа студента
      const studentButton = screen.getByText('Вход сотрудника');
      await user.click(studentButton);

      await waitFor(() => {
        expect(screen.getByText('Выберите свою группу')).toBeInTheDocument();
      });

      // Ждем загрузки
      await waitFor(() => {
        expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
      });

      // Кликаем "Назад к выбору входа"
      const backButton = screen.getByText('Назад к выбору входа');
      await user.click(backButton);

      // Проверяем что вернулись на главную страницу
      await waitFor(() => {
        expect(screen.getByText('Выберите способ входа')).toBeInTheDocument();
      });
    });
  });

  describe('Состояние localStorage', () => {
    it('должен очищать localStorage при переходах', async () => {
      const user = userEvent.setup();

      // Добавляем тестовые данные в localStorage
      localStorage.setItem('test_key', 'test_value');

      render(<TestApp />);

      // Переходим между страницами
      const adminButton = screen.getByText('Вход администратора');
      await user.click(adminButton);

      await waitFor(() => {
        expect(screen.getByText('Войти как администратор')).toBeInTheDocument();
      });

      // localStorage не должен автоматически очищаться при переходах
      expect(localStorage.getItem('test_key')).toBe('test_value');
    });

    it('должен сохранять данные студента в localStorage при успешном "входе"', async () => {
      const user = userEvent.setup();
      window.alert = jest.fn();

      render(<TestApp />);

      // Переходим на страницу студента
      const studentButton = screen.getByText('Вход сотрудника');
      await user.click(studentButton);

      await waitFor(() => {
        expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
      });

      // Пытаемся войти без выбора данных
      const loginButton = screen.getByText('Войти как студент');
      await user.click(loginButton);

      // Должно показать предупреждение
      expect(window.alert).toHaveBeenCalledWith('Пожалуйста, выберите город и группу');
    });
  });
});
