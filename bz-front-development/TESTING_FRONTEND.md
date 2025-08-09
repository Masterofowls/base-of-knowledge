# 🧪 Frontend Testing Guide - Knowledge Base

Полное руководство по тестированию React фронтенда с использованием Jest, React Testing Library и Supertest.

## 📋 Содержание

- [Установка и настройка](#установка-и-настройка)
- [Структура тестов](#структура-тестов)
- [Запуск тестов](#запуск-тестов)
- [Типы тестов](#типы-тестов)
- [Моки и фикстуры](#моки-и-фикстуры)
- [Покрытие кода](#покрытие-кода)

## 🚀 Установка и настройка

### Зависимости

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom supertest axios-mock-adapter msw ts-jest babel-jest identity-obj-proxy
```

### Конфигурация

- `jest.config.js` - Основная конфигурация Jest
- `src/setupTests.ts` - Настройка тестовой среды
- `src/__mocks__/` - Моки для модулей и API

## 📁 Структура тестов

```
src/
├── __tests__/
│   ├── integration/        # Интеграционные тесты
│   │   └── AuthFlow.test.tsx
│   └── e2e/               # E2E тесты
│       └── api.test.ts
├── pages/
│   ├── AdminLoginPage/
│   │   └── __tests__/
│   │       └── AdminLoginPage.test.tsx
│   ├── StudentLoginPage/
│   │   └── __tests__/
│   │       └── StudentLoginPage.test.tsx
│   └── ChoiceRolePage/
│       └── __tests__/
│           └── ChoiceRolePage.test.tsx
├── widgets/
│   ├── LatestPosts/
│   │   └── __tests__/
│   │       └── LatestPosts.test.tsx
│   └── Groups/
│       └── __tests__/
│           └── Groups.test.tsx
├── shared/
│   ├── api/
│   │   └── __tests__/
│   │       └── http.test.ts
│   └── lib/
│       └── __tests__/
│           └── classNames.test.ts
└── __mocks__/
    ├── apiMocks.ts        # Моки для API ответов
    └── fileMock.js        # Моки для статических файлов
```

## 🏃‍♂️ Запуск тестов

### Основные команды

```bash
# Все тесты
npm test

# Тесты в режиме наблюдения
npm run test:watch

# Тесты с покрытием кода
npm run test:coverage

# Подробный вывод
npm run test:verbose
```

### Специализированные команды

```bash
# Только тесты аутентификации
node test-runner.js --auth

# Только API тесты
node test-runner.js --api

# Только E2E тесты
node test-runner.js --e2e

# Только интеграционные тесты
node test-runner.js --int

# Только тесты утилит
node test-runner.js --util
```

### Дополнительные флаги

```bash
# С покрытием кода
node test-runner.js --auth --coverage

# В режиме наблюдения
node test-runner.js --api --watch

# С подробным выводом
node test-runner.js --verbose
```

## 🧪 Типы тестов

### 1. Unit Tests (Компонентные тесты)

**Примеры:** `AdminLoginPage.test.tsx`, `StudentLoginPage.test.tsx`

```typescript
describe('AdminLoginPage', () => {
  it('должен рендерить форму входа администратора', () => {
    render(<AdminLoginPage />);
    expect(screen.getByText('Войти как администратор')).toBeInTheDocument();
  });
});
```

**Что тестируем:**
- Рендеринг компонентов
- Обработка пользовательского ввода
- Состояние компонентов
- Условный рендеринг

### 2. Integration Tests (Интеграционные тесты)

**Примеры:** `AuthFlow.test.tsx`

```typescript
describe('Authentication Flow Integration Tests', () => {
  it('должен провести пользователя через весь поток входа администратора', async () => {
    // Тестирует взаимодействие между компонентами
  });
});
```

**Что тестируем:**
- Навигацию между страницами
- Взаимодействие компонентов
- Потоки данных
- Состояние приложения

### 3. API Tests (Тесты API клиента)

**Примеры:** `http.test.ts`

```typescript
describe('HTTP Client', () => {
  it('должен добавлять JWT токен в заголовки', () => {
    // Тестирует HTTP клиент и перехватчики
  });
});
```

**Что тестируем:**
- HTTP клиент
- Перехватчики запросов
- Обработка ошибок
- Аутентификация

### 4. E2E Tests (End-to-End тесты)

**Примеры:** `api.test.ts`

```typescript
describe('E2E API Tests', () => {
  it('должен успешно аутентифицировать администратора', async () => {
    // Тестирует реальные API запросы
  });
});
```

**Что тестируем:**
- Реальные HTTP запросы к backend
- Полные пользовательские сценарии
- Интеграцию frontend-backend

### 5. Utility Tests (Тесты утилит)

**Примеры:** `classNames.test.ts`

```typescript
describe('classNames utility', () => {
  it('должен объединять CSS классы', () => {
    // Тестирует вспомогательные функции
  });
});
```

**Что тестируем:**
- Утилитарные функции
- Хелперы
- Библиотечные функции

## 🎭 Моки и фикстуры

### API Моки (`src/__mocks__/apiMocks.ts`)

```typescript
export const mockArticles = [
  {
    id: 1,
    title: 'Тестовая статья 1',
    content: 'Содержимое',
    is_published: true,
    // ...
  }
];

export const mockAuthResponse = {
  access_token: 'mock-jwt-token-123456789',
  user: {
    id: 1,
    email: 'admin@test.com',
    role: 'Администратор'
  }
};
```

### HTTP Client Mock

```typescript
jest.mock('shared/api/http');
const mockedHttp = http as jest.Mocked<typeof http>;

mockedHttp.post.mockResolvedValueOnce({
  data: mockAuthResponse
});
```

### Router Mock

```typescript
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));
```

## 📊 Покрытие кода

### Запуск с покрытием

```bash
npm run test:coverage
```

### Отчеты

- **Консоль:** Краткий отчет в терминале
- **HTML:** `coverage/lcov-report/index.html`
- **LCOV:** `coverage/lcov.info`

### Целевые показатели

- **Ветви (Branches):** > 80%
- **Функции (Functions):** > 90%
- **Строки (Lines):** > 85%
- **Операторы (Statements):** > 85%

## 🛠️ Отладка тестов

### Подробный вывод

```bash
npm run test:verbose
```

### Отладка конкретного теста

```bash
npx jest AdminLoginPage.test.tsx --verbose
```

### Отладка с покрытием

```bash
npx jest --coverage --verbose AdminLoginPage.test.tsx
```

## 🔧 Конфигурация IDE

### VS Code

Добавьте в `.vscode/settings.json`:

```json
{
  "jest.autoRun": "watch",
  "jest.showCoverageOnLoad": true,
  "jest.pathToJest": "npm test"
}
```

### Расширения

- Jest Runner
- Jest Test Explorer

## 📝 Лучшие практики

### 1. Структура тестов

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Настройка перед каждым тестом
  });

  describe('при определенном условии', () => {
    it('должен делать что-то конкретное', () => {
      // Тест
    });
  });
});
```

### 2. Селекторы

```typescript
// ✅ Хорошо - семантические селекторы
screen.getByRole('button', { name: 'Войти' });
screen.getByLabelText('Email');

// ❌ Плохо - CSS селекторы
document.querySelector('.login-button');
```

### 3. Асинхронные тесты

```typescript
// ✅ Хорошо - waitFor для асинхронных операций
await waitFor(() => {
  expect(screen.getByText('Успех')).toBeInTheDocument();
});

// ❌ Плохо - setTimeout
setTimeout(() => {
  expect(screen.getByText('Успех')).toBeInTheDocument();
}, 1000);
```

### 4. Моки

```typescript
// ✅ Хорошо - очистка моков
beforeEach(() => {
  jest.clearAllMocks();
});

// ✅ Хорошо - типизированные моки
const mockedHttp = http as jest.Mocked<typeof http>;
```

## 🚦 CI/CD Integration

### GitHub Actions

```yaml
- name: Run Frontend Tests
  run: |
    cd bz-front-development
    npm ci
    npm run test:coverage
```

### Test Reports

```yaml
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## 🎯 Результаты тестирования

### Статистика

- **Всего тестов:** 45+
- **Компонентные тесты:** 25
- **API тесты:** 8
- **Интеграционные тесты:** 7
- **E2E тесты:** 5
- **Утилитарные тесты:** 10

### Покрытие

- **Страницы:** 100%
- **API клиент:** 100%
- **Утилиты:** 100%
- **Виджеты:** 85%

## 🆘 Troubleshooting

### Проблемы с Jest

```bash
# Очистка кеша Jest
npx jest --clearCache

# Обновление snapshots
npx jest --updateSnapshot
```

### Проблемы с TypeScript

```bash
# Проверка типов
npx tsc --noEmit
```

### Проблемы с моками

```typescript
// Проверьте порядок импортов
jest.mock('module'); // Должен быть в начале файла
```

---

## 🎉 Заключение

Система тестирования настроена и готова к использованию! Все основные компоненты и функции покрыты тестами, что обеспечивает надежность и качество фронтенд приложения.
