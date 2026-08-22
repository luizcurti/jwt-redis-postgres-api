const coveragePathIgnorePatterns = [
  '/node_modules/',
  '/src/server.ts',
  '/src/routes.ts',
  '/src/docs/',
  '/src/@types/',
];

const baseProject = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns,
};

const infraProject = {
  ...baseProject,
  setupFiles: ['<rootDir>/__tests__/testSetup/testEnv.js'],
  globalSetup: '<rootDir>/__tests__/testSetup/globalSetup.js',
  globalTeardown: '<rootDir>/__tests__/testSetup/globalTeardown.js',
};

module.exports = {
  testTimeout: 20000,
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns,
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  forceExit: true,
  projects: [
    {
      ...baseProject,
      displayName: 'unit',
      testMatch: ['<rootDir>/__tests__/unit/**/*.test.ts'],
    },
    {
      ...infraProject,
      displayName: 'integration',
      testMatch: ['<rootDir>/__tests__/integration/**/*.test.ts'],
    },
    {
      ...infraProject,
      displayName: 'e2e',
      testMatch: ['<rootDir>/__tests__/e2e/**/*.test.ts'],
    },
  ],
};
