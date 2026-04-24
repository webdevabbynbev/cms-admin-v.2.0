describe('Auth', () => {
  it('redirects unauthenticated user to /login', () => {
    cy.clearLocalStorage();
    cy.visit('/#/dashboard');
    cy.url().should('include', '/login');
  });

  it('renders login form fields', () => {
    cy.visit('/#/login');
    cy.contains('Sign in to your account').should('be.visible');
    cy.get('input[placeholder="Enter your email or username"]').should('be.visible');
    cy.get('input[placeholder="Enter your password"]').should('be.visible');
    cy.contains('button', 'Sign In').should('be.visible');
  });

  it('shows error toast on wrong credentials', () => {
    cy.visit('/#/login');
    cy.get('input[placeholder="Enter your email or username"]').type('wrong@email.com');
    cy.get('input[placeholder="Enter your password"]').type('wrongpassword');
    cy.contains('button', 'Sign In').click();
    cy.get('[data-sonner-toast][data-type="error"]').should('be.visible');
  });

  it('logs in successfully and lands on dashboard', () => {
    cy.visit('/#/login');
    cy.get('input[placeholder="Enter your email or username"]').type(
      Cypress.env('adminEmail'),
    );
    cy.get('input[placeholder="Enter your password"]').type(Cypress.env('adminPassword'));
    cy.contains('button', 'Sign In').click();
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('logout clears session and redirects to login', () => {
    cy.login();
    cy.visit('/#/dashboard');

    // Open profile dropdown in header and click logout
    cy.get('[data-testid="header-user-menu"]').click();
    cy.contains('Keluar').click();

    cy.url().should('include', '/login');
    cy.window().then((win) => {
      const raw = win.localStorage.getItem('auth-session');
      const parsed = JSON.parse(raw ?? '{}');
      expect(parsed?.state?.isAuthenticated).to.be.false;
    });
  });
});
