#!/usr/bin/env node

/**
 * Скрипт для запуска фронтенд тестов с различными опциями
 */

const { execSync } = require('child_process');
const path = require('path');

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(text) {
  console.log('\n' + '='.repeat(50));
  console.log(colorize(`🧪 ${text}`, 'cyan'));
  console.log('='.repeat(50));
}

function runCommand(command, description) {
  printHeader(description);
  
  try {
    console.log(colorize(`Выполняется: ${command}`, 'yellow'));
    
    const result = execSync(command, { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    
    console.log(colorize('\n✅ Команда выполнена успешно!', 'green'));
    return true;
  } catch (error) {
    console.log(colorize('\n❌ Ошибка выполнения команды', 'red'));
    console.error(error.message);
    return false;
  }
}

function showUsage() {
  console.log(colorize('\n📋 Доступные команды для тестирования:', 'bright'));
  console.log('');
  console.log(colorize('Основные команды:', 'yellow'));
  console.log('  npm test                     - Запустить все тесты');
  console.log('  npm run test:watch           - Запустить тесты в режиме наблюдения');
  console.log('  npm run test:coverage        - Запустить тесты с покрытием кода');
  console.log('  npm run test:verbose         - Запустить тесты с подробным выводом');
  console.log('');
  console.log(colorize('Специфические тесты:', 'yellow'));
  console.log('  node test-runner.js --auth   - Только тесты аутентификации');
  console.log('  node test-runner.js --api    - Только тесты API');
  console.log('  node test-runner.js --e2e    - Только E2E тесты');
  console.log('  node test-runner.js --int    - Только интеграционные тесты');
  console.log('  node test-runner.js --util   - Только тесты утилит');
  console.log('');
  console.log(colorize('Дополнительные флаги:', 'yellow'));
  console.log('  --verbose                    - Подробный вывод');
  console.log('  --coverage                   - С покрытием кода');
  console.log('  --watch                      - Режим наблюдения');
  console.log('');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    return;
  }

  let testCommand = 'jest';
  let testPaths = [];
  
  // Определяем какие тесты запускать
  if (args.includes('--auth')) {
    testPaths.push('src/pages/**/AdminLoginPage', 'src/pages/**/StudentLoginPage', 'src/pages/**/ChoiceRolePage');
  }
  
  if (args.includes('--api')) {
    testPaths.push('src/shared/api');
  }
  
  if (args.includes('--e2e')) {
    testPaths.push('src/__tests__/e2e');
  }
  
  if (args.includes('--int')) {
    testPaths.push('src/__tests__/integration');
  }
  
  if (args.includes('--util')) {
    testPaths.push('src/shared/lib');
  }
  
  // Добавляем флаги
  if (args.includes('--verbose')) {
    testCommand += ' --verbose';
  }
  
  if (args.includes('--coverage')) {
    testCommand += ' --coverage';
  }
  
  if (args.includes('--watch')) {
    testCommand += ' --watch';
  }
  
  // Добавляем пути к тестам
  if (testPaths.length > 0) {
    testCommand += ` --testPathPattern="${testPaths.join('|')}"`;
  }
  
  // Определяем описание
  let description = 'Запуск фронтенд тестов';
  if (args.includes('--auth')) description = 'Тесты аутентификации';
  if (args.includes('--api')) description = 'Тесты API клиента';
  if (args.includes('--e2e')) description = 'E2E тесты';
  if (args.includes('--int')) description = 'Интеграционные тесты';
  if (args.includes('--util')) description = 'Тесты утилит';
  
  console.log(colorize('🎯 Frontend Test Runner', 'magenta'));
  console.log(colorize('Система автотестирования для React приложения', 'blue'));
  
  const success = runCommand(testCommand, description);
  
  if (success) {
    console.log(colorize('\n🎉 Все тесты завершены!', 'green'));
    
    if (args.includes('--coverage')) {
      console.log(colorize('\n📊 Отчет о покрытии сохранен в папке coverage/', 'blue'));
    }
  } else {
    console.log(colorize('\n💥 Некоторые тесты завершились с ошибками', 'red'));
    process.exit(1);
  }
}

// Показываем использование если нет аргументов
if (process.argv.length === 2) {
  showUsage();
  process.exit(0);
}

main();
