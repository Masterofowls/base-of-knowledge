// Моки для API ответов

export const mockArticles = [
  {
    id: 1,
    title: 'Тестовая статья 1',
    content: 'Содержимое тестовой статьи 1',
    is_published: true,
    created_at: '2024-01-15T10:00:00Z',
    author: {
      id: 1,
      full_name: 'Тестовый Автор',
      role: 'Администратор'
    }
  },
  {
    id: 2,
    title: 'Тестовая статья 2',
    content: 'Содержимое тестовой статьи 2',
    is_published: false,
    created_at: '2024-01-16T10:00:00Z',
    author: {
      id: 2,
      full_name: 'Редактор Тест',
      role: 'Редактор'
    }
  }
];

export const mockCities = [
  { id: 1, name: 'Москва' },
  { id: 2, name: 'Санкт-Петербург' },
  { id: 3, name: 'Казань' }
];

export const mockGroups = [
  {
    id: 1,
    display_name: 'ИТ-101 (2024)',
    admission_year: { id: 1, year: 2024 },
    city: { id: 1, name: 'Москва' },
    education_form: { id: 1, name: 'Очная' },
    speciality: {
      id: 1,
      code: '09.02.07',
      name: 'Информационные системы и программирование'
    }
  },
  {
    id: 2,
    display_name: 'ИТ-102 (2024)',
    admission_year: { id: 1, year: 2024 },
    city: { id: 2, name: 'Санкт-Петербург' },
    education_form: { id: 1, name: 'Очная' },
    speciality: {
      id: 1,
      code: '09.02.07',
      name: 'Информационные системы и программирование'
    }
  }
];

export const mockSpecialities = [
  {
    id: 1,
    code: '09.02.07',
    name: 'Информационные системы и программирование',
    institution_type_id: 1
  },
  {
    id: 2,
    code: '38.02.01',
    name: 'Экономика и бухгалтерский учет',
    institution_type_id: 1
  }
];

export const mockEducationForms = [
  { id: 1, name: 'Очная' },
  { id: 2, name: 'Заочная' }
];

export const mockAdmissionYears = [
  { id: 1, year: 2023 },
  { id: 2, year: 2024 }
];

export const mockInstitutionTypes = [
  { id: 1, name: 'Колледж' },
  { id: 2, name: 'Вуз' },
  { id: 3, name: 'Школа' }
];

export const mockAuthResponse = {
  access_token: 'mock-jwt-token-123456789',
  user: {
    id: 1,
    email: 'admin@test.com',
    full_name: 'Тестовый Администратор',
    role: 'Администратор'
  }
};

export const mockEditorAuthResponse = {
  access_token: 'mock-jwt-token-editor-123',
  user: {
    id: 2,
    email: 'editor@test.com',
    full_name: 'Тестовый Редактор',
    role: 'Редактор'
  }
};
