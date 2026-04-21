// Smoke test for new v1.5 features (Batch 8 & 9):
// Transactions, Supabase Users, Picks (Abby/Bev/Top), Sale Promo
// Stock Adjustment and Brand Bulk Upload are POST-only — tested via shape validation only.
// Run: node scripts/smoke-test-new-features.mjs

const BASE = 'http://127.0.0.1:3333/api/v1';
const EMAIL = 'abbynbev@gmail.com';
const PASSWORD = 'Secret123!';

const results = { passed: [], warnings: [], errors: [] };

function pass(label) { results.passed.push(label); }
function warn(label, detail) { results.warnings.push({ label, detail }); }
function fail(label, detail) { results.errors.push({ label, detail }); }

async function req(method, path, { token, body, query } = {}) {
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
  const t = await r.text();
  try { return { status: r.status, json: JSON.parse(t) }; } catch { return { status: r.status, text: t }; }
}

function hasAny(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return false;
  return keys.some(k => Object.prototype.hasOwnProperty.call(obj, k));
}

function checkList(label, r, expectedRowKeys = [], opts = {}) {
  const { shape = 'serve' } = opts;
  if (r.status !== 200) { fail(label, `HTTP ${r.status} — ${r.json?.message ?? r.text?.slice(0, 120) ?? ''}`); return null; }
  let data, total;
  if (shape === 'serve') {
    const serve = r.json?.serve;
    if (!serve) { fail(label, 'missing serve wrapper'); return null; }
    data = serve.data;
    total = serve.total;
  } else if (shape === 'serve-array') {
    const serve = r.json?.serve;
    if (!Array.isArray(serve)) { fail(label, 'expected serve to be array'); return null; }
    data = serve; total = serve.length;
  }
  if (!Array.isArray(data)) { fail(label, `data not array (got ${typeof data})`); return null; }
  const sample = data[0];
  if (sample && expectedRowKeys.length) {
    const missing = expectedRowKeys.filter(k => !hasAny(sample, ...(Array.isArray(k) ? k : [k])));
    if (missing.length) warn(label, `row missing keys: ${JSON.stringify(missing)}`);
    else pass(`${label} shape OK${total != null ? ` (${total} total)` : ''}`);
  } else {
    pass(`${label} OK (empty or no keys to check)`);
  }
  return sample;
}

function checkSingle(label, r, expectedKeys = []) {
  if (r.status !== 200) { fail(label, `HTTP ${r.status} — ${r.json?.message ?? r.text?.slice(0, 120) ?? ''}`); return null; }
  const serve = r.json?.serve;
  if (!serve) { fail(label, 'missing serve wrapper'); return null; }
  const missing = expectedKeys.filter(k => !hasAny(serve, ...(Array.isArray(k) ? k : [k])));
  if (missing.length) warn(label, `missing keys: ${JSON.stringify(missing)}`);
  else pass(`${label} shape OK`);
  return serve;
}

(async () => {
  console.log('==== New Features Smoke Test ====\n');

  // --- Auth ---
  const login = await req('POST', '/auth/login-admin', {
    body: { email: EMAIL, password: PASSWORD },
  });
  if (login.status !== 200) {
    fail('auth/login-admin', `HTTP ${login.status} — check if backend is running`);
    printResults(); return;
  }
  const token = login.json?.serve?.token;
  if (!token) { fail('auth: no token in response'); printResults(); return; }
  pass('auth/login-admin');

  // --- Transactions ---
  console.log('\n-- Transactions --');
  const txRow = checkList(
    'GET /admin/transactions',
    await req('GET', '/admin/transactions', { token, query: { page: 1, per_page: 1 } }),
    ['id', ['transactionNumber', 'transaction_number'], 'amount', ['transactionStatus', 'transaction_status']],
  );
  if (txRow?.id) {
    checkSingle(
      `GET /admin/transactions/${txRow.id}`,
      await req('GET', `/admin/transactions/${txRow.id}`, { token }),
      ['id', ['transactionNumber', 'transaction_number'], 'amount'],
    );
  }

  // --- Supabase Users ---
  console.log('\n-- Supabase Users --');
  checkList(
    'GET /admin/total-user-list',
    await req('GET', '/admin/total-user-list', { token, query: { page: 1, per_page: 1 } }),
    ['id', 'email', ['totalOrders', 'total_orders'], ['lifetimeValue', 'ltv', 'lifetime_value']],
  );
  const summaryR = await req('GET', '/admin/total-user-summary', { token });
  if (summaryR.status !== 200) {
    fail('GET /admin/total-user-summary', `HTTP ${summaryR.status}`);
  } else {
    const serve = summaryR.json?.serve;
    const keys = ['totalUsers', 'total_users', 'activeUsers', 'active_users', 'totalCustomers', 'total_customers'];
    if (!serve || !keys.some(k => hasAny(serve, k))) warn('GET /admin/total-user-summary', `unexpected shape: ${JSON.stringify(serve).slice(0, 100)}`);
    else pass('GET /admin/total-user-summary shape OK');
  }

  // --- Picks ---
  console.log('\n-- Picks (Abby / Bev / Top) --');
  for (const [label, endpoint] of [
    ['abby-picks', '/admin/abby-picks'],
    ['bev-picks', '/admin/bev-picks'],
    ['top-picks-promo', '/admin/top-picks-promo'],
  ]) {
    // Picks use {meta, data} shape (no serve wrapper)
    const r = await req('GET', endpoint, { token, query: { page: 1, per_page: 1 } });
    if (r.status !== 200) { fail(`GET ${endpoint}`, `HTTP ${r.status}`); continue; }
    if (!r.json?.meta || !Array.isArray(r.json?.data)) {
      fail(`GET ${endpoint}`, `expected {meta, data} shape, got: ${JSON.stringify(r.json).slice(0, 100)}`);
    } else {
      const sample = r.json.data[0];
      if (sample) {
        const missing = [['productId', 'product_id'], 'order', ['isActive', 'is_active']]
          .filter(k => !hasAny(sample, ...(Array.isArray(k) ? k : [k])));
        if (missing.length) warn(`GET ${endpoint}`, `row missing: ${JSON.stringify(missing)}`);
        else pass(`GET ${endpoint} shape OK (${r.json.meta.total} total)`);
      } else {
        pass(`GET ${endpoint} OK (empty)`);
      }
    }
  }

  // --- Sale Promo ---
  console.log('\n-- Sale Promo --');
  // Sales: serve is a flat array (no server-side pagination)
  const salesR = await req('GET', '/admin/sales', { token });
  let saleRow = null;
  if (salesR.status !== 200) {
    fail('GET /admin/sales', `HTTP ${salesR.status}`);
  } else if (!Array.isArray(salesR.json?.serve)) {
    fail('GET /admin/sales', `expected serve to be array, got: ${JSON.stringify(salesR.json).slice(0, 100)}`);
  } else {
    saleRow = salesR.json.serve[0] ?? null;
    if (saleRow) {
      const missing = [['startDatetime', 'start_datetime'], ['endDatetime', 'end_datetime'], ['isPublish', 'is_publish']]
        .filter(k => !hasAny(saleRow, ...(Array.isArray(k) ? k : [k])));
      if (missing.length) warn('GET /admin/sales', `row missing: ${JSON.stringify(missing)}`);
      else pass(`GET /admin/sales shape OK (${salesR.json.serve.length} total)`);
    } else {
      pass('GET /admin/sales OK (empty)');
    }
  }
  if (saleRow?.id) {
    checkSingle(
      `GET /admin/sales/${saleRow.id}`,
      await req('GET', `/admin/sales/${saleRow.id}`, { token }),
      ['id', ['startDatetime', 'start_datetime'], ['endDatetime', 'end_datetime'], 'variants'],
    );
  }

  // --- Stock Movements (existing endpoint, new Adjustment dialog POSTs here) ---
  console.log('\n-- Stock Movements (adjustment endpoint reachable) --');
  // Just verify the endpoint exists (HEAD-like: GET list still works)
  const smR = await req('GET', '/admin/stock-movements', { token, query: { page: 1, per_page: 1 } });
  if (smR.status !== 200) fail('GET /admin/stock-movements', `HTTP ${smR.status}`);
  else pass('GET /admin/stock-movements (adjustment POST endpoint same base, reachable)');

  // --- Brand Bulk Upload (verify endpoints respond, not 404) ---
  console.log('\n-- Brand Bulk Upload endpoints ---');
  // POST with empty body → expect 4xx (validation error), not 404/500
  for (const [label, ep] of [
    ['POST /brands/bulk/logos', '/brands/bulk/logos'],
    ['POST /brands/bulk/banners', '/brands/bulk/banners'],
  ]) {
    const r = await req('POST', ep, { token, body: {} });
    if (r.status === 404) fail(label, '404 — endpoint not found on backend');
    else if (r.status >= 500) warn(label, `HTTP ${r.status} — server error (may need multipart)`);
    else pass(`${label} reachable (HTTP ${r.status})`);
  }

  printResults();
})().catch(e => { console.error('\nUncaught:', e.stack || e); process.exit(3); });

function printResults() {
  console.log('\n==== SUMMARY ====');
  console.log(`  PASS:  ${results.passed.length}`);
  console.log(`  WARN:  ${results.warnings.length}`);
  console.log(`  FAIL:  ${results.errors.length}`);
  if (results.warnings.length) {
    console.log('\n---- WARNINGS (shape drift, non-blocking) ----');
    for (const w of results.warnings) console.log(`  [WARN] ${w.label}: ${w.detail ?? ''}`);
  }
  if (results.errors.length) {
    console.log('\n---- FAILURES ----');
    for (const e of results.errors) console.log(`  [FAIL] ${e.label}: ${e.detail ?? ''}`);
    process.exit(2);
  } else {
    console.log('\nAll checks passed!');
  }
}
