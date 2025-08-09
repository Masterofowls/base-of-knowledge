import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Groups from '../ui/Groups';
import http from 'shared/api/http';
import { mockGroups } from '../../../__mocks__/apiMocks';

// Mock API client
jest.mock('shared/api/http');
const mockedHttp = http as jest.Mocked<typeof http>;

describe('Groups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен рендерить заголовок виджета групп', () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: []
    });

    render(<Groups />);

    const widget = document.querySelector('.Groups');
    expect(widget).toBeInTheDocument();
  });

  it('должен загружать группы при монтировании', async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: mockGroups
    });

    render(<Groups />);

    await waitFor(() => {
      expect(mockedHttp.get).toHaveBeenCalledWith('/api/categories/groups');
    });
  });

  it('должен отображать группы после загрузки', async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: mockGroups
    });

    render(<Groups />);

    // Ждем загрузки групп
    await waitFor(() => {
      expect(screen.getByText('ИТ-101 (2024)')).toBeInTheDocument();
      expect(screen.getByText('ИТ-102 (2024)')).toBeInTheDocument();
    });
  });

  it('должен отображать информацию о группе включая город и год', async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: mockGroups
    });

    render(<Groups />);

    await waitFor(() => {
      // Проверяем что отображается год и город
      expect(screen.getByText('2024 (Москва)')).toBeInTheDocument();
      expect(screen.getByText('2024 (Санкт-Петербург)')).toBeInTheDocument();
    });
  });

  it('должен показывать сообщение "No groups found" если групп нет', async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: []
    });

    render(<Groups />);

    await waitFor(() => {
      expect(screen.getByText('No groups found.')).toBeInTheDocument();
    });
  });

  it('должен обрабатывать ошибки загрузки групп', async () => {
    mockedHttp.get.mockRejectedValueOnce(new Error('API Error'));
    
    console.error = jest.fn(); // Подавляем console.error

    render(<Groups />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to fetch groups:', expect.any(Error));
    });

    // Проверяем, что сообщение об отсутствии групп показывается при ошибке
    expect(screen.getByText('No groups found.')).toBeInTheDocument();
  });

  it('должен иметь правильный CSS класс', () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: []
    });

    render(<Groups />);

    const widget = document.querySelector('.Groups');
    expect(widget).toBeInTheDocument();
  });

  it('должен принимать и применять дополнительный className', () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: []
    });

    const testClassName = 'test-groups-class';
    render(<Groups className={testClassName} />);

    const widget = document.querySelector(`.${testClassName}`);
    expect(widget).toBeInTheDocument();
  });

  it('должен отображать группы в правильной структуре', async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: mockGroups
    });

    render(<Groups />);

    await waitFor(() => {
      // Проверяем структуру отображения групп
      const groupsWrap = document.querySelector('.GroupsWrap');
      expect(groupsWrap).toBeInTheDocument();
    });
  });

  it('должен правильно обрабатывать группы без города', async () => {
    const groupsWithoutCity = [
      {
        id: 1,
        display_name: 'ИТ-101 (2024)',
        admission_year: { id: 1, year: 2024 },
        city: null, // Группа без города
        education_form: { id: 1, name: 'Очная' },
        speciality: {
          id: 1,
          code: '09.02.07',
          name: 'Информационные системы и программирование'
        }
      }
    ];

    mockedHttp.get.mockResolvedValueOnce({
      data: groupsWithoutCity
    });

    render(<Groups />);

    await waitFor(() => {
      expect(screen.getByText('ИТ-101 (2024)')).toBeInTheDocument();
      // Проверяем что компонент не падает при отсутствии города
    });
  });

  it('должен правильно обрабатывать группы без года поступления', async () => {
    const groupsWithoutYear = [
      {
        id: 1,
        display_name: 'ИТ-101',
        admission_year: null, // Группа без года
        city: { id: 1, name: 'Москва' },
        education_form: { id: 1, name: 'Очная' },
        speciality: {
          id: 1,
          code: '09.02.07',
          name: 'Информационные системы и программирование'
        }
      }
    ];

    mockedHttp.get.mockResolvedValueOnce({
      data: groupsWithoutYear
    });

    render(<Groups />);

    await waitFor(() => {
      expect(screen.getByText('ИТ-101')).toBeInTheDocument();
      // Проверяем что компонент не падает при отсутствии года
    });
  });

  it('должен делать запрос только один раз при монтировании', async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: mockGroups
    });

    const { rerender } = render(<Groups />);

    await waitFor(() => {
      expect(mockedHttp.get).toHaveBeenCalledTimes(1);
    });

    // Перерендерим компонент
    rerender(<Groups />);

    // Убеждаемся что запрос не был сделан повторно
    expect(mockedHttp.get).toHaveBeenCalledTimes(1);
  });

  it('должен отображать правильное количество студентов', async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: mockGroups
    });

    render(<Groups />);

    await waitFor(() => {
      // Проверяем что отображается количество студентов (в данном случае 0)
      const studentCounts = screen.getAllByText('0 студентов');
      expect(studentCounts.length).toBeGreaterThan(0);
    });
  });
});
