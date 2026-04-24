// Tests that sidebar links navigate to the correct pages.
// cy.login() uses cy.session() — token is cached across tests in this file.

beforeEach(() => {
  cy.login();
  cy.visit('/#/dashboard');
});

describe('Sidebar navigation — Catalog', () => {
  it('navigates to Produk', () => {
    cy.contains('a', 'Produk').click({ force: true });
    cy.url().should('include', '/products-new');
    cy.contains('Produk').should('be.visible');
  });

  it('navigates to Banner', () => {
    cy.contains('a', 'Banner').click({ force: true });
    cy.url().should('include', '/banners-new');
  });

  it('navigates to Brand', () => {
    cy.contains('a', 'Brand').click({ force: true });
    cy.url().should('include', '/brands-new');
  });
});

describe('Sidebar navigation — Marketing', () => {
  it('navigates to Diskon', () => {
    cy.contains('a', 'Diskon').click({ force: true });
    cy.url().should('include', '/discounts-new');
    cy.contains('Diskon').should('be.visible');
  });

  it('navigates to Voucher', () => {
    cy.contains('a', 'Voucher').click({ force: true });
    cy.url().should('include', '/vouchers-new');
  });

  it('navigates to Flash Sale', () => {
    cy.contains('a', 'Flash Sale').click({ force: true });
    cy.url().should('include', '/flash-sales-new');
  });
});

describe('Sidebar navigation — CRM & System', () => {
  it('navigates to Customers', () => {
    cy.contains('a', 'Customer').click({ force: true });
    cy.url().should('include', '/customers-new');
  });

  it('navigates to Activity Log', () => {
    cy.contains('a', 'Activity Log').click({ force: true });
    cy.url().should('include', '/activity-logs-new');
  });

  it('navigates to Admin Management', () => {
    cy.contains('a', 'Admin Management').click({ force: true });
    cy.url().should('include', '/admins-new');
  });
});
