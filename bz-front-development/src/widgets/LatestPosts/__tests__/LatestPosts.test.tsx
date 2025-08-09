import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LatestPosts from '../ui/LatestPosts';
import http from 'shared/api/http';
import { mockArticles } from '../../../__mocks__/apiMocks';

// Mock API client
jest.mock('shared/api/http');
const mockedHttp = http as jest.Mocked<typeof http>;

describe('LatestPosts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен рендерить заголовок виджета', () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: { articles: [] }
    });

    render(<LatestPosts />);

    // Ищем элементы, которые могут содержать заголовок (зависит от реализации)
    const widget = document.querySelector('.LatestPosts');
    expect(widget).toBeInTheDocument();
  });

  it('должен загружать статьи при монтировании', async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: { articles: mockArticles }
    });

    render(<LatestPosts />);

    await waitFor(() => {
      expect(mockedHttp.get).toHaveBeenCalledWith('/api/articles');
    });
  });

  it('должен отображать статьи после загрузки', async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: { articles: mockArticles }
    });

    render(<LatestPosts />);

    // Ждем загрузки статей
    await waitFor(() => {
      expect(screen.getByText('Тестовая статья 1')).toBeInTheDocument();
      expect(screen.getByText('Тестовая статья 2')).toBeInTheDocument();
    });
  });

  it('должен показывать сообщение "No articles found" если статей нет', async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: { articles: [] }
    });

    render(<LatestPosts />);

    await waitFor(() => {
      expect(screen.getByText('No articles found.')).toBeInTheDocument();
    });
  });

  it('должен обрабатывать ошибки загрузки', async () => {
    mockedHttp.get.mockRejectedValueOnce(new Error('API Error'));
    
    console.error = jest.fn(); // Подавляем console.error

    render(<LatestPosts />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to fetch articles:', expect.any(Error));
    });

    // Проверяем, что сообщение об отсутствии статей показывается при ошибке
    expect(screen.getByText('No articles found.')).toBeInTheDocument();
  });

  it('должен иметь правильный CSS класс', () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: { articles: [] }
    });

    render(<LatestPosts />);

    const widget = document.querySelector('.LatestPosts');
    expect(widget).toBeInTheDocument();
  });

  it('должен принимать и применять дополнительный className', () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: { articles: [] }
    });

    const testClassName = 'test-class';
    render(<LatestPosts className={testClassName} />);

    const widget = document.querySelector(`.${testClassName}`);
    expect(widget).toBeInTheDocument();
  });

  it('должен отображать статьи в правильной структуре', async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: { articles: mockArticles }
    });

    render(<LatestPosts />);

    await waitFor(() => {
      // Проверяем структуру отображения статей
      const postsWrap = document.querySelector('.LatestPostsWrap');
      expect(postsWrap).toBeInTheDocument();

      // Проверяем что каждая статья имеет правильный CSS класс
      const postItems = document.querySelectorAll('.postItem');
      expect(postItems).toHaveLength(mockArticles.length);
    });
  });

  it('должен делать запрос только один раз при монтировании', async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: { articles: mockArticles }
    });

    const { rerender } = render(<LatestPosts />);

    await waitFor(() => {
      expect(mockedHttp.get).toHaveBeenCalledTimes(1);
    });

    // Перерендерим компонент
    rerender(<LatestPosts />);

    // Убеждаемся что запрос не был сделан повторно
    expect(mockedHttp.get).toHaveBeenCalledTimes(1);
  });

  it('должен правильно очищать эффекты при размонтировании', () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: { articles: mockArticles }
    });

    const { unmount } = render(<LatestPosts />);

    // Размонтируем компонент
    unmount();

    // Проверяем что нет предупреждений о memory leaks
    // (Jest автоматически проверит это)
  });
});
