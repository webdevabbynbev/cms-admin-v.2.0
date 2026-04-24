import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    requestTimeout: 15000,
  },
  env: {
    apiUrl: 'http://localhost:3333/api/v1',
    adminEmail: 'abbynbev@gmail.com',
    adminPassword: 'Secret123!',
  },
});
