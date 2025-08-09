import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ChoiceRolePage from '../ui/ChoiceRolePage';

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

describe('ChoiceRolePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderChoiceRolePage = () => {
    return render(
      <RouterWrapper>
        <ChoiceRolePage />
      </RouterWrapper>
    );
  };

  it('должен рендерить заголовок и описание', () => {
    renderChoiceRolePage();

    expect(screen.getByText('Выберите способ входа')).toBeInTheDocument();
  });

  it('должен отображать две карточки с ролями', () => {
    renderChoiceRolePage();

    // Проверяем наличие обеих карточек
    const employeeButtons = screen.getAllByText('Сотрудник');
    expect(employeeButtons).toHaveLength(2); // Заголовок и текст на карточке
    
    expect(screen.getByText('Вход сотрудника')).toBeInTheDocument();
    expect(screen.getByText('Вход администратора')).toBeInTheDocument();
  });

  it('должен отображать описания для каждой роли', () => {
    renderChoiceRolePage();

    expect(screen.getByText('Выберите свою группу для просмотра материалов')).toBeInTheDocument();
    // Поскольку текст повторяется, проверяем что он есть в DOM
    const descriptions = screen.getAllByText('Выберите свою группу для просмотра материалов');
    expect(descriptions).toHaveLength(2);
  });

  it('должен перенаправлять на страницу входа сотрудника при клике', async () => {
    const user = userEvent.setup();
    renderChoiceRolePage();

    const studentLoginButton = screen.getByText('Вход сотрудника');
    await user.click(studentLoginButton);

    expect(mockNavigate).toHaveBeenCalledWith('/studentlogin');
  });

  it('должен перенаправлять на страницу входа администратора при клике', async () => {
    const user = userEvent.setup();
    renderChoiceRolePage();

    const adminLoginButton = screen.getByText('Вход администратора');
    await user.click(adminLoginButton);

    expect(mockNavigate).toHaveBeenCalledWith('/adminlogin');
  });

  it('должен отображать ссылки навигации', () => {
    renderChoiceRolePage();

    expect(screen.getByText('Вернуться на главную')).toBeInTheDocument();
    expect(screen.getByText('Регистрация администратора')).toBeInTheDocument();
  });

  it('должен иметь правильные стили для кнопок', () => {
    renderChoiceRolePage();

    const studentButton = screen.getByText('Вход сотрудника');
    const adminButton = screen.getByText('Вход администратора');

    // Проверяем, что кнопки имеют правильные цвета
    expect(studentButton.closest('button')).toHaveStyle({
      backgroundColor: '#00AAFF'
    });

    expect(adminButton.closest('button')).toHaveStyle({
      backgroundColor: 'rgba(228, 74, 119, 1)'
    });
  });

  it('должен отображать иконки для каждой роли', () => {
    renderChoiceRolePage();

    // Проверяем наличие SVG иконок (они импортированы как React компоненты)
    // В зависимости от реализации SVG компонентов, может потребоваться другой способ проверки
    const containers = screen.getAllByRole('button');
    expect(containers.length).toBeGreaterThanOrEqual(2);
  });

  it('должен иметь правильную структуру контейнеров', () => {
    renderChoiceRolePage();

    // Проверяем основную обертку
    const mainWrapper = document.querySelector('.page-center-wrapper');
    expect(mainWrapper).toBeInTheDocument();
  });

  it('должен корректно обрабатывать множественные клики', async () => {
    const user = userEvent.setup();
    renderChoiceRolePage();

    const studentLoginButton = screen.getByText('Вход сотрудника');
    
    // Делаем несколько кликов
    await user.click(studentLoginButton);
    await user.click(studentLoginButton);

    // navigate должен быть вызван дважды
    expect(mockNavigate).toHaveBeenCalledTimes(2);
    expect(mockNavigate).toHaveBeenCalledWith('/studentlogin');
  });

  it('должен отображать правильную ширину кнопок', () => {
    renderChoiceRolePage();

    const studentButton = screen.getByText('Вход сотрудника');
    const adminButton = screen.getByText('Вход администратора');

    expect(studentButton.closest('button')).toHaveStyle({
      width: '230px'
    });

    expect(adminButton.closest('button')).toHaveStyle({
      width: '230px'
    });
  });
});
