// Comprehensive smoke test for all v1.5 GET endpoints.
// Validates: 200 response + presence of expected keys per normalizer.
// Run: node scripts/smoke-test-v15.mjs

const BASE = 'http://127.0.0.1:3333/api/v1';

const results = { passed: [], warnings: [], errors: [] };

function pass(label) { results.passed.push(label); }
function warn(label, detail) { results.warnings.push({ label, detail }); }
function fail(label, detail) { results.errors.push({ label, detail }); }

async function req(method, path, { token, body, query, blob } = {}) {
  const url = new URL(BASE + path);
  if (query) for (const [k, v] of Object.entries(query)) if (v != null) url.searchParams.set(k, String(v));
  const r = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (blob) return { status: r.status, size: (await r.arrayBuffer()).byteLength };
  const t = await r.text();
  try { return { status: r.status, json: JSON.parse(t) }; } catch { return { status: r.status, text: t }; }
}

function hasAny(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return false;
  return keys.some(k => Object.prototype.hasOwnProperty.call(obj, k));
}

function checkList(label, r, expectedRowKeys = [], opts = {}) {
  const { shape = 'serve' } = opts; // 'serve' | 'meta-data' | 'data-only' | 'serve-array'
  if (r.status !== 200) { fail(label, `HTTP ${r.status}`); return null; }
  let data, total;
  if (shape === 'serve') {
    const serve = r.json?.serve;
    if (!serve) { fail(label, 'no serve wrapper'); return null; }
    data = serve.data;
    total = serve.total;
  } else if (shape === 'serve-array') {
    const serve = r.json?.serve;
    if (!Array.isArray(serve)) { fail(label, 'expected serve to be array'); return null; }
    data = serve;
    total = serve.length;
  } else if (shape === 'meta-data') {
    data = r.json?.data;
    total = r.json?.meta?.total;
    if (!Array.isArray(data)) { fail(label, 'expected {meta, data}'); return null; }
  } else if (shape === 'data-only') {
    data = r.json?.data;
  }
  if (!Array.isArray(data)) { fail(label, `data not array (got ${typeof data})`); return null; }
  const sample = data[0];
  if (sample && expectedRowKeys.length) {
    const missing = expectedRowKeys.filter(k => !hasAny(sample, ...(Array.isArray(k) ? k : [k])));
    if (missing.length) warn(label, `row missing: ${JSON.stringify(missing)}`);
    else pass(`${label} shape OK${total != null ? ` (${total} total)` : ''}`);
  } else {
    pass(`${label} OK (empty)`);
  }
  return sample;
}

function checkSingle(label, r, expectedKeys = []) {
  if (r.status !== 200) { fail(label, `HTTP ${r.status}`); return null; }
  const serve = r.json?.serve;
  if (!serve) { fail(label, 'no serve wrapper'); return null; }
  const missing = expectedKeys.filter(k => !hasAny(serve, ...(Array.isArray(k) ? k : [k])));
  if (missing.length) warn(label, `missing: ${JSON.stringify(missing)}`);
  else pass(`${label} shape OK`);
  return serve;
}

(async () => {
  console.log('==== v1.5 API Smoke Test ====\n');

  const login = await req('POST', '/auth/login-admin', {
    body: { email: 'abbynbev@gmail.com', password: 'Secret123!' },
  });
  if (login.status !== 200) { fail('auth/login-admin', login.text?.slice(0, 200)); printResults(); return; }
  const token = login.json?.serve?.token;
  if (!token) { fail('auth: no token'); printResults(); return; }
  pass('auth/login-admin');

  // ===== Catalog =====
  console.log('\n-- Catalog --');
  checkList('brands', await req('GET', '/admin/brands', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name', 'slug', ['logoUrl', 'logo_url']]);
  checkList('tags', await req('GET', '/admin/tags', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name', 'slug']);
  checkList('personas', await req('GET', '/admin/personas', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name', 'slug']);
  checkList('category-types', await req('GET', '/admin/category-types', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name', 'slug', ['parentId', 'parent_id'], 'level']);
  checkList('concern', await req('GET', '/admin/concern', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name', 'slug', 'position']);
  checkList('concern-options', await req('GET', '/admin/concern-options', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name', 'slug', ['concernId', 'concern_id']]);
  checkList('profile-categories', await req('GET', '/admin/profile-categories', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name']);
  checkList('profile-category-options', await req('GET', '/admin/profile-category-options', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'label', 'value', ['profileCategoriesId', 'profile_categories_id']]);

  // ===== Marketing =====
  console.log('\n-- Marketing --');
  const discountRow = checkList('discounts', await req('GET', '/admin/discounts', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name', 'code', ['valueType', 'value_type'], ['isActive', 'is_active']]);
  if (discountRow?.id) {
    checkSingle('discounts/:id detail', await req('GET', `/admin/discounts/${discountRow.id}`, { token }),
      ['id', 'name', 'code', ['variantItems', 'variant_items']]);
  }
  checkList('discount-options/brands', await req('GET', '/admin/discount-options/brands', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name']);
  checkList('discount-options/products', await req('GET', '/admin/discount-options/products', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name', ['brandId', 'brand_id']]);
  checkList('discount-options/product-variants', await req('GET', '/admin/discount-options/product-variants', { token, query: { page: 1, per_page: 1 } }),
    [['product_variant_id', 'id'], ['product_id', 'productId'], 'sku']);
  checkList('vouchers', await req('GET', '/admin/voucher', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name', 'code', 'type']);
  const flashList = await req('GET', '/admin/flashsales', { token });
  if (flashList.status === 200 && Array.isArray(flashList.json?.serve)) {
    pass(`flashsales OK (${flashList.json.serve.length} total)`);
    const row = flashList.json.serve[0];
    if (row && !hasAny(row, 'products', 'variants')) warn('flashsales', 'no products[] or variants[]');
  } else fail('flashsales', `shape unexpected`);
  checkList('b1g1', await req('GET', '/admin/buy-one-get-one', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name', 'code'], { shape: 'meta-data' });
  checkList('gift-products', await req('GET', '/admin/gift-products', { token, query: { page: 1, per_page: 1 } }),
    ['id', ['name', 'productName', 'product_name']], { shape: 'meta-data' });
  checkList('ned', await req('GET', '/admin/ned', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name']);
  checkList('referral-codes', await req('GET', '/admin/referral-codes', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'code', ['discountPercent', 'discount_percent']], { shape: 'meta-data' });

  // ===== Content CMS =====
  console.log('\n-- Content CMS --');
  for (const slug of ['privacy-policy', 'term-and-conditions', 'return-policy', 'about-us', 'contact-us']) {
    const r = await req('GET', `/admin/${slug}`, { token });
    if (r.status !== 200) fail(`content/${slug}`, `HTTP ${r.status}`);
    else if (!hasAny(r.json?.serve, 'value')) warn(`content/${slug}`, 'missing value');
    else pass(`content/${slug}`);
  }
  checkList('faq', await req('GET', '/admin/faq', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'question', 'answer']);

  // ===== System =====
  console.log('\n-- System --');
  checkList('settings', await req('GET', '/admin/settings', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'key', 'group', 'value']);
  checkList('admin/users', await req('GET', '/admin/users', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'email', 'role', ['roleName', 'role_name']]);
  checkList('activity-logs', await req('GET', '/admin/activity-logs', { token, query: { page: 1, per_page: 1 } }),
    ['id', ['roleName', 'role_name'], ['userName', 'user_name'], 'activity']);

  // ===== CRM / Customer =====
  console.log('\n-- CRM --');
  checkList('customers', await req('GET', '/admin/customers', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'email', ['firstName', 'first_name'], ['phoneNumber', 'phone_number']]);
  checkList('crm/members', await req('GET', '/admin/crm/members', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name', 'email', ['crmTier', 'crm_tier']]);
  checkList('crm/affiliate', await req('GET', '/admin/crm/affiliate', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'code', ['discountPercent', 'discount_percent']]);
  checkList('user-carts', await req('GET', '/admin/user-carts', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'email']);

  // ===== Inventory =====
  console.log('\n-- Inventory --');
  checkList('stock-movements', await req('GET', '/admin/stock-movements', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'type', 'change']);

  // ===== Home Banners =====
  console.log('\n-- Home Banners --');
  checkList('home-banners/sections', await req('GET', '/admin/home-banners/sections', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name', 'slug', 'order']);

  // ===== Ramadan =====
  console.log('\n-- Ramadan --');
  checkList('ramadan-spin-prizes', await req('GET', '/admin/ramadan-spin-prizes', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name', 'weight'], { shape: 'meta-data' });
  checkList('ramadan-recommendations', await req('GET', '/admin/ramadan-recommendations', { token, query: { page: 1, per_page: 1 } }),
    ['id']);
  checkList('ramadan-recommendation-banners', await req('GET', '/admin/ramadan-recommendation-banners', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'title', ['bannerDate', 'banner_date']]);
  checkList('ramadan-participants', await req('GET', '/admin/ramadan-participants', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'name', 'email']);

  // ===== Abeauties / SEO =====
  console.log('\n-- Abeauties / SEO --');
  checkList('abeauty-squad', await req('GET', '/admin/abeauty-squad', { token, query: { page: 1, per_page: 1 } }),
    ['id', ['fullName', 'full_name'], 'status']);
  const seo = await req('GET', '/admin/seo/live-stats', { token });
  if (seo.status !== 200) fail('seo/live-stats', `HTTP ${seo.status}`);
  else if (!hasAny(seo.json?.data, 'activeUsers', 'minutes')) warn('seo/live-stats', 'missing activeUsers/minutes');
  else pass('seo/live-stats');

  // ===== Reports =====
  console.log('\n-- Reports (async, ~5s each) --');
  async function runReport(type, dataKeys, summaryKeys) {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 7 * 86400_000);
    const create = await req('POST', '/admin/reports', {
      token,
      body: {
        title: `Smoke ${type}`, report_type: type, report_period: 'custom', report_format: 'json',
        start_date: yesterday.toISOString(), end_date: now.toISOString(), channel: 'all', filters: {},
      },
    });
    if (create.status >= 400) { fail(`reports.create(${type})`, create.json?.message ?? `HTTP ${create.status}`); return; }
    const id = create.json?.serve?.id;
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 700));
      const g = await req('GET', `/admin/reports/${id}`, { token });
      const status = g.json?.serve?.status;
      if (status === 'completed') {
        const serve = g.json.serve;
        const missD = dataKeys.filter(k => !hasAny(serve.data, k));
        const missS = summaryKeys.filter(k => !hasAny(serve.summary, k));
        if (missD.length || missS.length) warn(`reports.${type}`, `data missing:${JSON.stringify(missD)} summary missing:${JSON.stringify(missS)}`);
        else pass(`reports.${type} shape OK`);
        return;
      }
      if (status === 'failed') { fail(`reports.${type}`, serve.errorMessage ?? 'failed'); return; }
    }
    fail(`reports.${type}`, 'timeout waiting for completed');
  }

  await runReport('revenue', ['revenue_by_date'], ['total_gross_revenue', 'total_net_revenue']);
  await runReport('inventory', ['products', 'low_stock_products'], ['total_products', 'total_stock_value']);
  await runReport('sales', ['transactions'], ['total_transactions', 'total_revenue']);
  await runReport('customer', ['customers'], ['total_customers', 'total_revenue']);
  await runReport('transaction', ['transactions'], ['total_transactions', 'total_amount']);

  const dash = await req('GET', '/admin/reports/dashboard-summary', {
    token,
    query: {
      start_date: new Date(Date.now() - 7 * 86400_000).toISOString(),
      end_date: new Date().toISOString(),
      channel: 'all',
    },
  });
  if (dash.status !== 200) fail('dashboard-summary', `HTTP ${dash.status}`);
  else if (!hasAny(dash.json?.serve, 'summary', 'trend')) warn('dashboard-summary', 'missing summary/trend');
  else pass('dashboard-summary');

  printResults();
})().catch(e => { console.error('\nUncaught:', e.stack || e); process.exit(3); });

function printResults() {
  console.log('\n==== SUMMARY ====');
  console.log(`  PASS:  ${results.passed.length}`);
  console.log(`  WARN:  ${results.warnings.length}`);
  console.log(`  FAIL:  ${results.errors.length}`);
  if (results.warnings.length) {
    console.log('\n---- WARNINGS (shape drift, non-blocking) ----');
    for (const w of results.warnings) console.log(`  ${w.label}: ${w.detail ?? ''}`);
  }
  if (results.errors.length) {
    console.log('\n---- FAILURES ----');
    for (const e of results.errors) console.log(`  ${e.label}: ${e.detail ?? ''}`);
    process.exit(2);
  }
}
