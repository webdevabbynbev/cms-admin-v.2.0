# CMS Admin — Abby n Bev

Admin panel e-commerce untuk brand Abby n Bev. Mengelola produk, transaksi, pelanggan, promosi, dan konten. Dibangun di atas React + Vite dengan Tailwind 4 + Shadcn UI (v1.5 — Ant Design sudah dihapus sepenuhnya).

## Stack

| Layer | Library |
|---|---|
| Framework | React 18 (function components) + TypeScript |
| Build | Vite 7 + SWC |
| Styling | Tailwind CSS 4 + Shadcn UI (Radix primitives) |
| Server state | Tanstack Query v5 |
| Client state | Zustand v5 |
| Forms | React Hook Form + Zod v4 |
| Routing | `react-router-dom` v7 via `createHashRouter` (`/#/path`) |
| HTTP | Axios via `@/config/axios` (auto-attaches bearer token) |
| Rich text | Tiptap v3 |
| Charts | Recharts v3 |
| Date/time | `moment-timezone` (zona waktu WIB) |
| Toast | Sonner |
| Icons | Lucide React |
| Unit test | Vitest + Testing Library |
| E2E test | Cypress |

## Perintah

```bash
# Development
npm run dev                  # dev server (default port 5173)
npm run dev:staging          # staging mode

# Build
npm run build                # production build
npm run build:staging        # staging build
npm run build:production     # production build (eksplisit)

# Type check
npx tsc --noEmit -p tsconfig.app.json

# Unit test
npm test                     # vitest watch mode
npm test -- --run            # single-shot (394 tests, 30 files)
npm run test:ui              # vitest UI

# E2E test
npm run cy:open              # Cypress interactive
npm run cy:run               # Cypress headless (Electron)

# Smoke test (hit ~50 API endpoints)
node scripts/smoke-test-v15.mjs
```

## Struktur direktori

```
src/
  App.tsx                  # root: theme effect + providers + router
  main.tsx                 # StrictMode + App
  features/                # 36 modul fitur
    <feature>/
      types/               # interface + enum (single source of truth)
      services/            # axios calls
      hooks/               # useQuery / useMutation
      schemas/             # Zod form schema
      utils/               # normalize, formatters, helper spesifik fitur
      stores/              # zustand (langka, mis. products/csv-import)
      components/          # ListTable, FormDialog, dll.
      pages/               # <Name>ListPage, <Name>DetailPage
      index.ts             # barrel export
  components/
    common/                # PageContainer, PageHeader, DataTable,
                           # ConfirmDialog, RichTextEditor,
                           # SortableList, ReorderDialog,
                           # LoadingState, EmptyState, ErrorState
    ui/                    # shadcn-generated primitives
    ErrorBoundary/
  config/                  # axios, query-client
  constants/               # QUERY_KEYS, countries, uploadPaths
  layouts/                 # AppShell, MainLayout, SidebarNav,
                           # HeaderActions, ChangePasswordDialog, FullLayout
  lib/                     # cn (utils.ts), api-types, meta-pagination, axios-error
  providers/               # AppProviders
  router/                  # createHashRouter + lazy routes + legacy redirects
  stores/                  # auth.store, theme.store
  styles/                  # theme.css, globals.css
  utils/                   # timezone, env, analytics/, pwa/
  test/                    # vitest setup (setup.ts)
```

## Daftar fitur

| Modul | Deskripsi |
|---|---|
| `auth` | Login admin, session management |
| `dashboard` | Ringkasan metrik, grafik penjualan, abandoned-cart widget |
| `products` | Produk, varian, atribut, CSV import, duplicate mode |
| `brands` | Master merek, bulk-upload logo |
| `tags` | Tag produk |
| `personas` | Persona pelanggan |
| `category-types` | Tipe kategori produk |
| `concerns` | Concern/target produk (kulit, dll.) |
| `profile-categories` | Kategori profil pelanggan |
| `customers` | Data pelanggan, segmentasi |
| `crm` | Member & afiliasi |
| `transactions` | Order & transaksi |
| `abandoned-carts` | Keranjang terbengkalai |
| `stock-movements` | Mutasi stok |
| `discounts` | Diskon & kode promo |
| `vouchers` | Voucher belanja |
| `flash-sale` | Flash sale dengan picker varian/merek + conflict handler |
| `b1g1` | Buy One Get One |
| `gifts` | Gift product |
| `sale` | Sale period |
| `picks` | Abby Picks / Bev Picks / Top Picks Promo (dengan drag-drop reorder) |
| `home-banners` | Banner halaman utama (drag-drop reorder per seksi) |
| `banner` | Banner lain |
| `ned` | NED (promo spesial) |
| `ramadan` | Ramadan spin prizes |
| `referral-codes` | Kode referral |
| `abeauties-squad` | Program Abeauties Squad |
| `supabase-users` | Pengguna Supabase |
| `admins` | Manajemen admin |
| `profile` | Profil admin login |
| `activity-logs` | Log aktivitas |
| `reports` | Laporan: Dashboard, Sales, Customer, Transaction, dll. |
| `content-pages` | Halaman konten statis |
| `seo` | Konfigurasi SEO |
| `faqs` | FAQ |
| `settings` | Pengaturan sistem |

## Konvensi API

- **Base URL:** `http://localhost:3333/api/v1`
- **Auth:** `POST /auth/login-admin` → `{ email, password }`, token di `response.data.serve.token`
- **Standard response:** `{ message?, serve: { ... } }`
- **Exceptions** (no `serve`, pakai `{ meta, data }`):
  - `/admin/ramadan-spin-prizes`, `/admin/buy-one-get-one`, `/admin/gift-products`, `/admin/referral-codes`
  - Gunakan helper `toPaginated()` dari `@/lib/meta-pagination`
- **Pagination (Adonis):** `{ data, total, perPage, currentPage, lastPage, firstPage }`
- **Reorder:** `POST /admin/<resource>/update-order` dengan body `{ updates: [{id, order}] }`
- **Error handling:** `extractAxiosErrorMessage(err, fallback)` dari `@/lib/axios-error`

## Konvensi kode

- Interfaces & enum di `features/<x>/types/` — tidak di service, utils, atau komponen
- Payload wire: `snake_case`; TypeScript: `camelCase`. Service yang mengkonversi
- Datetime: API → ISO `+07:00`. Form input: `datetime-local`. Konversi pakai `moment-timezone` + `WIB_TZ` dari `@/utils/timezone`
- Slug untuk URL detail: Brand/Tag/Persona/CategoryTypes/Concern. Numeric ID untuk: ProfileCategory/Settings/FAQ/Admin/Ramadan/dll.
- Routing: `createHashRouter` → semua URL berbasis hash (`/#/path`)
- Lazy load semua route
- `React.memo` pada dialog berat

## Menambah fitur baru

1. `src/features/<name>/types/` — interface + enum
2. `src/features/<name>/utils/normalize.ts` — reshape API response
3. `src/features/<name>/services/<name>.service.ts` — axios CRUD
4. `src/features/<name>/hooks/use<Name>.ts` — Tanstack Query wrappers
5. `src/features/<name>/schemas/<name>-form.schema.ts` — Zod (jika ada form)
6. `src/features/<name>/components/` — ListTable + FormDialog
7. `src/features/<name>/pages/<Name>ListPage.tsx` — dibungkus `<AppShell>`
8. Tambah lazy import + `Route` di `src/router/index.tsx` (gunakan helper `protectedRoute`)
9. Tambah entry di `SidebarNav.tsx` + `QUERY_KEYS` constant
10. Jalankan `npx tsc --noEmit` dan `node scripts/smoke-test-v15.mjs`

## Testing

Unit test dicolocate di `src/**/*.test.ts`. Setup: `src/test/setup.ts`.

```bash
npm test -- --run   # 394 tests, 30 files, 0 failures
```

Coverage mencakup: utils lib, semua normalizer dengan branching non-trivial, payload builders, tree helpers, pricing logic.

E2E via Cypress (`cypress/` directory).
