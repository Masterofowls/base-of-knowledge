import axios from 'axios';
import http from '../http';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: {
        use: jest.fn()
      },
      response: {
        use: jest.fn()
      }
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }))
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HTTP Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Очищаем localStorage
    localStorage.clear();
  });

  it('должен создать экземпляр axios с правильной базовой конфигурацией', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:5000',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('должен добавить перехватчик запросов для автоматического добавления JWT токена', () => {
    const mockAxiosInstance = mockedAxios.create();
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
  });

  it('должен правильно добавлять JWT токен из localStorage в заголовки', () => {
    // Симулируем наличие токена в localStorage
    const mockToken = 'test-jwt-token';
    localStorage.setItem('jwt_token', mockToken);

    // Получаем перехватчик запросов
    const mockAxiosInstance = mockedAxios.create();
    const requestInterceptor = (mockAxiosInstance.interceptors.request.use as jest.Mock).mock.calls[0][0];

    // Создаем конфиг запроса
    const config = {
      headers: {}
    };

    // Вызываем перехватчик
    const result = requestInterceptor(config);

    // Проверяем, что токен добавлен в заголовки
    expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
  });

  it('не должен добавлять заголовок Authorization если токена нет', () => {
    // Убеждаемся, что токена нет в localStorage
    localStorage.removeItem('jwt_token');

    // Получаем перехватчик запросов
    const mockAxiosInstance = mockedAxios.create();
    const requestInterceptor = (mockAxiosInstance.interceptors.request.use as jest.Mock).mock.calls[0][0];

    // Создаем конфиг запроса
    const config = {
      headers: {}
    };

    // Вызываем перехватчик
    const result = requestInterceptor(config);

    // Проверяем, что Authorization заголовок не добавлен
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('должен корректно обрабатывать ошибки запросов', () => {
    const mockAxiosInstance = mockedAxios.create();
    const errorHandler = (mockAxiosInstance.interceptors.request.use as jest.Mock).mock.calls[0][1];

    const mockError = new Error('Request failed');
    
    expect(() => errorHandler(mockError)).toThrow('Request failed');
  });
});
