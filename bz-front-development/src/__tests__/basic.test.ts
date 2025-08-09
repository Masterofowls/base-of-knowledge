/**
 * Базовый тест для проверки настройки Jest
 */

describe('Jest Configuration', () => {
  it('должен правильно запускаться', () => {
    expect(1 + 1).toBe(2);
  });

  it('должен иметь доступ к Jest функциям', () => {
    const mockFn = jest.fn();
    mockFn('test');
    
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('должен поддерживать async/await', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });

  it('должен работать с localStorage mock', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
  });
});
