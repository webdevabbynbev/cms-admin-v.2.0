declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
    }
  }
}

// Programmatic login — calls the API directly, sets Zustand auth-session in localStorage.
// Uses cy.session() so the token is reused across tests in the same run.
Cypress.Commands.add('login', () => {
  cy.session(
    'admin',
    () => {
      // Visit first so cy.window() has a target
      cy.visit('/#/login');

      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login-admin`,
        body: {
          email: Cypress.env('adminEmail'),
          password: Cypress.env('adminPassword'),
        },
      }).then(({ body }) => {
        const { token, data: user, permissions, menu_access } = body.serve;

        cy.window().then((win) => {
          // Zustand persist store (primary)
          win.localStorage.setItem(
            'auth-session',
            JSON.stringify({
              state: {
                token,
                user,
                permissions,
                menuAccess: menu_access ?? {},
                isAuthenticated: true,
              },
              version: 0,
            }),
          );

          // Legacy session mirror (axios interceptor reads this)
          win.localStorage.setItem(
            'session',
            JSON.stringify({ token, data: user, permissions, menu_access: menu_access ?? {} }),
          );
        });
      });
    },
    {
      validate() {
        cy.window().then((win) => {
          const raw = win.localStorage.getItem('auth-session');
          const parsed = JSON.parse(raw ?? '{}');
          expect(parsed?.state?.isAuthenticated).to.be.true;
        });
      },
    },
  );
});
