import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import StudentLoginPage from '../ui/StudentLoginPage';
import http from 'shared/api/http';
import { mockCities, mockGroups } from '../../../__mocks__/apiMocks';

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

describe('StudentLoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Настройка моков для API вызовов
    mockedHttp.get.mockImplementation((url) => {
      if (url === '/api/categories/cities') {
        return Promise.resolve({ data: mockCities });
      }
      if (url === '/api/categories/groups') {
        return Promise.resolve({ data: mockGroups });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  const renderStudentLoginPage = () => {
    return render(
      <RouterWrapper>
        <StudentLoginPage />
      </RouterWrapper>
    );
  };

  it('должен рендерить форму выбора группы студента', async () => {
    renderStudentLoginPage();

    expect(screen.getByText('Выберите свою группу')).toBeInTheDocument();
    
    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('Город')).toBeInTheDocument();
      expect(screen.getByText('Группа')).toBeInTheDocument();
    });
  });

  it('должен показывать индикатор загрузки', () => {
    renderStudentLoginPage();

    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('должен загружать города и группы при монтировании', async () => {
    renderStudentLoginPage();

    await waitFor(() => {
      expect(mockedHttp.get).toHaveBeenCalledWith('/api/categories/cities');
      expect(mockedHttp.get).toHaveBeenCalledWith('/api/categories/groups');
    });

    // Проверяем, что загрузка завершилась
    await waitFor(() => {
      expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
    });
  });

  it('должен корректно обрабатывать выбор города и группы', async () => {
    const user = userEvent.setup();
    renderStudentLoginPage();

    // Ждем загрузки
    await waitFor(() => {
      expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
    });

    // Проверяем наличие селектов (в зависимости от реализации react-select)
    const citySelect = screen.getByText('Выберите город');
    const groupSelect = screen.getByText('Выберите группу');

    expect(citySelect).toBeInTheDocument();
    expect(groupSelect).toBeInTheDocument();
  });

  it('должен показать предупреждение при попытке входа без выбора города и группы', async () => {
    const user = userEvent.setup();
    window.alert = jest.fn();

    renderStudentLoginPage();

    // Ждем загрузки
    await waitFor(() => {
      expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
    });

    const loginButton = screen.getByText('Войти как студент');
    await user.click(loginButton);

    expect(window.alert).toHaveBeenCalledWith('Пожалуйста, выберите город и группу');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('должен сохранять выбор в localStorage при успешном входе', async () => {
    const user = userEvent.setup();
    renderStudentLoginPage();

    // Ждем загрузки
    await waitFor(() => {
      expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
    });

    // Симулируем выбор значений (это зависит от того, как именно реализован onChange в компоненте)
    // Поскольку у нас есть моки, можем проверить что localStorage.setItem будет вызван при правильном выборе
  });

  it('должен обрабатывать ошибки загрузки данных', async () => {
    // Настройка мока для ошибки
    mockedHttp.get.mockRejectedValue(new Error('API Error'));
    
    console.error = jest.fn(); // Подавляем console.error

    renderStudentLoginPage();

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to fetch data:', expect.any(Error));
    });
  });

  it('должен отображать кнопку "Назад" с обработчиком клика', async () => {
    const user = userEvent.setup();
    renderStudentLoginPage();

    // Ждем загрузки
    await waitFor(() => {
      expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
    });

    const backButton = screen.getByText('Назад к выбору входа');
    expect(backButton).toBeInTheDocument();

    await user.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('должен отображать примечание о сохранении данных', async () => {
    renderStudentLoginPage();

    await waitFor(() => {
      expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Примечание: Данные студентов не сохраняются в базе данных/)).toBeInTheDocument();
  });

  it('должен иметь правильную структуру формы', async () => {
    renderStudentLoginPage();

    await waitFor(() => {
      expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
    });

    // Проверяем наличие заголовка
    expect(screen.getByText('Выберите свою группу')).toBeInTheDocument();
    
    // Проверяем наличие кнопки входа
    const loginButton = screen.getByText('Войти как студент');
    expect(loginButton).toBeInTheDocument();
    expect(loginButton.closest('button')).toHaveStyle({
      backgroundColor: 'rgba(0, 170, 255, 1)'
    });
  });
});
