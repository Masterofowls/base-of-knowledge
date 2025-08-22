export default {
  testEnvironment: 'node',
  verbose: true,
  transform: {},
  testMatch: ['**/api-tests/**/*.mjs'],
  testPathIgnorePatterns: ['<rootDir>/api-tests/jest.setup.mjs'],
  setupFilesAfterEnv: ['<rootDir>/api-tests/jest.setup.mjs']
}


