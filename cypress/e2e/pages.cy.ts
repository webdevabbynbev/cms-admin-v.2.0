// Smoke: key pages render their primary heading/content without JS errors.
// Uses programmatic login — not testing auth flow here.

beforeEach(() => {
  cy.login();
});

describe('Dashboard', () => {
  it('renders stats and charts', () => {
    cy.visit('/#/dashboard');
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Overview of your store performance').should('be.visible');
  });
});

describe('Products', () => {
  it('renders product list page', () => {
    cy.visit('/#/products-new');
    cy.contains('Produk').should('be.visible');
  });

  it('renders product form page for new product', () => {
    cy.visit('/#/product-form-new');
    cy.get('h1').contains('Add New Product').should('be.visible');
  });
});

describe('Marketing pages', () => {
  it('renders discount list', () => {
    cy.visit('/#/discounts-new');
    cy.contains('Diskon').should('be.visible');
  });

  it('renders voucher list', () => {
    cy.visit('/#/vouchers-new');
    cy.contains('Voucher').should('be.visible');
  });

  it('renders flash sale list', () => {
    cy.visit('/#/flash-sales-new');
    cy.contains('Flash Sale').should('be.visible');
  });
});

describe('CRM pages', () => {
  it('renders customer list', () => {
    cy.visit('/#/customers-new');
    cy.contains('Customer').should('be.visible');
  });

  it('renders transaction list', () => {
    cy.visit('/#/transactions-new');
    cy.get('h1').contains('Transaksi').should('be.visible');
  });
});

describe('Reports', () => {
  it('renders dashboard report', () => {
    cy.visit('/#/reports-new/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('renders inventory report', () => {
    cy.visit('/#/reports-new/inventory');
    cy.contains('Inventory').should('be.visible');
  });
});

describe('Content CMS', () => {
  it('renders privacy policy editor', () => {
    cy.visit('/#/privacy-policy-new');
    cy.contains('Privacy Policy').should('be.visible');
  });

  it('renders FAQ list', () => {
    cy.visit('/#/faqs-new');
    cy.contains('FAQ').should('be.visible');
  });
});

describe('Master data', () => {
  it('renders tags', () => {
    cy.visit('/#/tags-new');
    cy.contains('Tag').should('be.visible');
  });

  it('renders brands', () => {
    cy.visit('/#/brands-new');
    cy.contains('Brand').should('be.visible');
  });

  it('renders category types', () => {
    cy.visit('/#/category-types-new');
    cy.contains('Category').should('be.visible');
  });
});
