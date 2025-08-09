import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AdminLoginPage from '../ui/AdminLoginPage';
import http from 'shared/api/http';
import { mockAuthResponse } from '../../../__mocks__/apiMocks';

// Mock API client
jest.mock('shared/api/http');
const mockedHttp = http as jest.Mocked<typeof http>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Wrapper компонент с Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('AdminLoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderAdminLoginPage = () => {
    return render(
      <RouterWrapper>
        <AdminLoginPage />
      </RouterWrapper>
    );
  };

  it('должен рендерить форму входа администратора', () => {
    renderAdminLoginPage();

    expect(screen.getByText('Войти как администратор')).toBeInTheDocument();
    expect(screen.getByLabelText('Логин')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
  });

  it('должен корректно обновлять поля ввода', async () => {
    const user = userEvent.setup();
    renderAdminLoginPage();

    const emailInput = screen.getByLabelText('Логин');
    const passwordInput = screen.getByLabelText('Пароль');

    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('admin@test.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('должен успешно выполнить вход при корректных данных', async () => {
    const user = userEvent.setup();
    
    // Настройка мока для успешного ответа
    mockedHttp.post.mockResolvedValueOnce({
      data: mockAuthResponse
    });

    renderAdminLoginPage();

    const emailInput = screen.getByLabelText('Логин');
    const passwordInput = screen.getByLabelText('Пароль');
    const loginButton = screen.getByText('Войти как администратор');

    // Заполняем форму
    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'Admin123!');
    
    // Отправляем форму
    await user.click(loginButton);

    // Проверяем, что API был вызван с правильными данными
    await waitFor(() => {
      expect(mockedHttp.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'admin@test.com',
        password: 'Admin123!'
      });
    });

    // Проверяем, что токен сохранен в localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('jwt_token', mockAuthResponse.access_token);
    expect(localStorage.setItem).toHaveBeenCalledWith('user_role', mockAuthResponse.user.role);

    // Проверяем перенаправление
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('должен показать ошибку при неверных учетных данных', async () => {
    const user = userEvent.setup();
    
    // Настройка мока для ошибки 401
    mockedHttp.post.mockRejectedValueOnce({
      response: { status: 401 }
    });

    // Mock alert
    window.alert = jest.fn();

    renderAdminLoginPage();

    const emailInput = screen.getByLabelText('Логин');
    const passwordInput = screen.getByLabelText('Пароль');
    const loginButton = screen.getByText('Войти как администратор');

    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(loginButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Invalid credentials');
    });

    // Проверяем, что перенаправление не произошло
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('должен обрабатывать сетевые ошибки', async () => {
    const user = userEvent.setup();
    
    // Настройка мока для сетевой ошибки
    mockedHttp.post.mockRejectedValueOnce(new Error('Network Error'));

    console.error = jest.fn(); // Подавляем console.error
    window.alert = jest.fn();

    renderAdminLoginPage();

    const emailInput = screen.getByLabelText('Логин');
    const passwordInput = screen.getByLabelText('Пароль');
    const loginButton = screen.getByText('Войти как администратор');

    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'Admin123!');
    await user.click(loginButton);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Login failed:', expect.any(Error));
    });
  });

  it('должен иметь правильные атрибуты для полей ввода', () => {
    renderAdminLoginPage();

    const emailInput = screen.getByLabelText('Логин');
    const passwordInput = screen.getByLabelText('Пароль');

    expect(emailInput).toHaveAttribute('placeholder', 'Введите логин');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('placeholder', 'Введите пароль');
  });

  it('должен отображать ссылки навигации', () => {
    renderAdminLoginPage();

    expect(screen.getByText('Назад к выбору входа')).toBeInTheDocument();
    expect(screen.getByText('Регистрация администратора')).toBeInTheDocument();
  });
});
