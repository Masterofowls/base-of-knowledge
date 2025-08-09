import { classNames } from '../classNames/classNames';

describe('classNames utility', () => {
  it('должен возвращать основной класс', () => {
    const result = classNames('main-class');
    expect(result).toBe('main-class');
  });

  it('должен объединять основной класс с дополнительными', () => {
    const result = classNames('main-class', {}, ['additional-1', 'additional-2']);
    expect(result).toBe('main-class additional-1 additional-2');
  });

  it('должен добавлять условные классы когда они true', () => {
    const mods = {
      'active': true,
      'disabled': false,
      'highlighted': true
    };
    
    const result = classNames('main-class', mods, []);
    expect(result).toBe('main-class active highlighted');
  });

  it('должен игнорировать условные классы когда они false', () => {
    const mods = {
      'active': false,
      'disabled': false
    };
    
    const result = classNames('main-class', mods, []);
    expect(result).toBe('main-class');
  });

  it('должен обрабатывать все параметры вместе', () => {
    const mods = {
      'active': true,
      'disabled': false,
      'highlighted': true
    };
    
    const additional = ['additional-1', 'additional-2'];
    
    const result = classNames('main-class', mods, additional);
    expect(result).toBe('main-class active highlighted additional-1 additional-2');
  });

  it('должен обрабатывать пустые параметры', () => {
    expect(classNames('main-class', {}, [])).toBe('main-class');
    expect(classNames('main-class', undefined, undefined)).toBe('main-class');
  });

  it('должен обрабатывать undefined и null в дополнительных классах', () => {
    const additional = ['class1', undefined, 'class2', null, 'class3'];
    const result = classNames('main-class', {}, additional);
    expect(result).toBe('main-class class1 class2 class3');
  });

  it('должен корректно обрабатывать пустые строки', () => {
    const result = classNames('', { active: true }, ['', 'valid-class']);
    expect(result).toBe('active valid-class');
  });

  it('должен обрабатывать сложные случаи с множественными пробелами', () => {
    const result = classNames('main-class', { 'has-spaces': true }, ['  extra-class  ']);
    expect(result.split(' ').filter(Boolean)).toEqual(['main-class', 'has-spaces', 'extra-class']);
  });

  it('должен быть типобезопасным с TypeScript', () => {
    // Этот тест проверяет что функция работает с TypeScript типами
    const mods: Record<string, boolean> = {
      active: true,
      disabled: false
    };
    
    const additional: (string | undefined)[] = ['class1', undefined, 'class2'];
    
    const result = classNames('main', mods, additional);
    expect(typeof result).toBe('string');
    expect(result).toBe('main active class1 class2');
  });

  it('должен обрабатывать числовые значения в модификаторах', () => {
    const mods = {
      'active': 1,
      'disabled': 0,
      'count': 5
    };
    
    const result = classNames('main-class', mods as any, []);
    expect(result).toBe('main-class active count');
  });

  it('должен работать с реальными CSS классами', () => {
    // Пример реального использования
    const isActive = true;
    const isLoading = false;
    const theme = 'dark';
    
    const result = classNames(
      'button',
      {
        'button--active': isActive,
        'button--loading': isLoading
      },
      [theme && `button--${theme}`]
    );
    
    expect(result).toBe('button button--active button--dark');
  });
});
