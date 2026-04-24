# CMS Admin — Abby n Bev

Admin panel e-commerce untuk brand **Abby n Bev**. Mengelola produk, transaksi, pelanggan, promosi, konten, dan laporan. Dibangun dengan React + Vite + Tailwind 4 + Shadcn UI (v1.5 — Ant Design sudah dihapus sepenuhnya).

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Perintah Dev](#perintah-dev)
- [Struktur Direktori](#struktur-direktori)
- [Fitur & Routes](#fitur--routes)
- [Arsitektur & Pola Kode](#arsitektur--pola-kode)
- [Komponen Shared](#komponen-shared)
- [API Conventions](#api-conventions)
- [State Management](#state-management)
- [Testing](#testing)
- [Menambah Fitur Baru](#menambah-fitur-baru)
- [Konvensi Kode](#konvensi-kode)
- [Known Quirks & Gotchas](#known-quirks--gotchas)

---

## Tech Stack

| Layer | Library | Versi |
|---|---|---|
| Language | TypeScript | ~5.8 |
| Framework | React (function components) | 18.3 |
| Build | Vite + SWC | 7.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | Shadcn UI (Radix primitives) | — |
| Server state | Tanstack Query | v5 |
| Client state | Zustand | v5 |
| Forms | React Hook Form | v7 |
| Schema validation | Zod | v4 |
| Routing | react-router-dom via `createHashRouter` | v7 |
| HTTP client | Axios | v1 |
| Rich text | Tiptap | v3 |
| Charts | Recharts | v3 |
| Date/time | moment-timezone (zona WIB) | v0.6 |
| Toast | Sonner | v2 |
| Icons | Lucide React | — |
| Unit test | Vitest + Testing Library | v4 |
| E2E test | Cypress | v15 |

---

## Prerequisites

- **Node.js** v18+ (disarankan v20+)
- **npm** v9+
- Backend API berjalan di `http://localhost:3333` (AdonisJS)

---

## Getting Started

```bash
# Clone dan install dependencies
npm install

# Jalankan dev server
npm run dev
# → http://localhost:5173
```

Login default untuk testing:
- **Email:** `abbynbev@gmail.com`
- **Password:** `Secret123!`

---

## Environment Variables

Buat file `.env.local` di root project (tidak perlu commit):

```env
# Base URL API backend (default: http://localhost:3333/api/v1)
VITE_API_URL=http://localhost:3333/api/v1

# Untuk staging
VITE_API_URL=https://api-staging.abbynbev.com/api/v1
```

File `.env` yang tersedia:
| File | Dipakai untuk |
|---|---|
| `.env` | Default (development) |
| `.env.staging` | `npm run dev:staging` / `build:staging` |
| `.env.production` | `npm run build:production` |

---

## Perintah Dev

```bash
# Development
npm run dev                        # dev server → localhost:5173
npm run dev:staging                # dev server dengan env staging

# Build
npm run build                      # production build → dist/
npm run build:staging              # staging build
npm run build:production           # production build (eksplisit tsc check)
npm run preview                    # preview build lokal

# Type check
npx tsc --noEmit -p tsconfig.app.json

# Unit test
npm test                           # vitest watch mode
npm test -- --run                  # single-shot (497 tests, 45 files)
npm run test:ui                    # vitest UI di browser

# Smoke test — hit ~47 endpoint API live (backend harus running)
node scripts/smoke-test-v15.mjs

# E2E test (dev server harus running di port 5173)
npm run cy:open                    # Cypress GUI interaktif
npm run cy:run                     # Cypress headless (Electron)

# Linting
npm run lint
```

---

## Struktur Direktori

```
cms-admin-abbynbev/
├── cypress/                        # E2E tests
│   ├── e2e/
│   │   ├── auth.cy.ts              # Login, logout, protected routes
│   │   ├── navigation.cy.ts        # Sidebar navigation
│   │   └── pages.cy.ts             # Key pages render
│   ├── support/
│   │   ├── commands.ts             # cy.login() custom command
│   │   └── e2e.ts                  # Global support file
│   └── tsconfig.json
├── scripts/
│   └── smoke-test-v15.mjs          # Hit semua GET endpoint, cek response shape
├── src/
│   ├── App.tsx                     # Root: theme effect + AppProviders + router
│   ├── main.tsx                    # StrictMode + App
│   ├── features/                   # 36 modul fitur (lihat bagian Fitur & Routes)
│   │   └── <feature>/
│   │       ├── types/              # interface + enum (single source of truth)
│   │       ├── services/           # axios CRUD calls
│   │       ├── hooks/              # Tanstack Query useQuery/useMutation
│   │       ├── schemas/            # Zod form schema
│   │       ├── utils/              # normalize, formatters, helpers
│   │       │   └── *.test.ts       # unit tests (colocated)
│   │       ├── stores/             # Zustand (langka, mis. csv-import)
│   │       ├── components/         # ListTable, FormDialog, dll.
│   │       ├── pages/              # <Name>ListPage, <Name>FormPage
│   │       └── index.ts            # barrel export
│   ├── components/
│   │   ├── common/                 # Komponen shared (lihat bagian Komponen Shared)
│   │   ├── ui/                     # Shadcn-generated primitives (jangan edit manual)
│   │   └── ErrorBoundary/
│   ├── config/
│   │   ├── axios.ts                # Axios instance + auth interceptor + 401 handler
│   │   └── query-client.ts         # Tanstack Query client config
│   ├── constants/
│   │   ├── query-keys.constant.ts  # Semua QUERY_KEYS terpusat
│   │   └── ...
│   ├── layouts/
│   │   ├── AppShell.tsx            # Layout utama (sidebar + header)
│   │   ├── MainLayout.tsx          # Grid layout: sidebar kiri, konten kanan
│   │   ├── SidebarNav.tsx          # Navigasi sidebar dengan permission gating
│   │   ├── HeaderActions.tsx       # Header kanan: profil, tema, ganti password
│   │   ├── ChangePasswordDialog.tsx
│   │   └── FullLayout.tsx          # Layout untuk halaman login/forgot
│   ├── lib/
│   │   ├── api-types.ts            # ServeWrapper<T>, AdonisPaginationMeta, AdonisPaginatedPayload<T>
│   │   ├── axios-error.ts          # extractAxiosErrorMessage(err, fallback)
│   │   ├── meta-pagination.ts      # toPaginated() untuk endpoint non-serve
│   │   └── utils.ts                # cn() (class merging)
│   ├── providers/
│   │   └── AppProviders.tsx        # QueryClient + Tooltip + ErrorBoundary + Toaster + Devtools
│   ├── router/
│   │   └── index.tsx               # createHashRouter + lazy routes + legacy redirects
│   ├── stores/
│   │   ├── auth.store.ts           # Zustand auth: token, user, permissions (persist 'auth-session')
│   │   └── theme.store.ts          # Zustand theme: 'light' | 'dark'
│   ├── styles/
│   │   ├── globals.css             # Tailwind base, Shadcn @theme inline
│   │   └── theme.css               # CSS variables light/dark
│   ├── test/
│   │   └── setup.ts                # Vitest setup (@testing-library/jest-dom)
│   └── utils/
│       ├── timezone.ts             # toWib(), formatWib(), WIB_TZ constant
│       ├── env.ts                  # Helper untuk import.meta.env
│       ├── analytics/
│       └── pwa/
├── cypress.config.ts
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.app.json
└── package.json
```

---

## Fitur & Routes

Semua route menggunakan hash (`/#/path`) karena `createHashRouter`.

### Autentikasi (Public)
| Route | Halaman |
|---|---|
| `/#/login` | Login admin |
| `/#/forgot` | Forgot password |

### Dashboard & Produk
| Route | Halaman | Fitur |
|---|---|---|
| `/#/dashboard` | Dashboard | Stats, grafik penjualan, abandoned cart |
| `/#/products-new` | List Produk | Search, filter, pagination |
| `/#/product-form-new` | Form Produk Baru | Tab: Basic/Category/Variants/Media/SEO |
| `/#/product-form-new?id=:id` | Edit Produk | Sama dengan form baru |
| `/#/product-duplicate?id=:id` | Duplikat Produk | Clone produk yang ada |
| `/#/banners-new` | List Banner | CRUD banner dengan upload gambar |
| `/#/home-banners-new` | Home Banner Sections | Manajemen seksi + drag-drop reorder |

### Marketing & Promosi
| Route | Halaman | Fitur |
|---|---|---|
| `/#/discounts-new` | List Diskon | Filter status/channel/scope |
| `/#/discounts-new/:id` | Form Diskon | Date range, target produk/semua |
| `/#/vouchers-new` | List Voucher | Filter status/tipe |
| `/#/vouchers-new/:id` | Form Voucher | |
| `/#/flash-sales-new` | List Flash Sale | |
| `/#/flash-sales-new/:id` | Form Flash Sale | Brand picker, variant picker, conflict 409 handler |
| `/#/sales-new` | List Sale | |
| `/#/sales-new/:id` | Form Sale | |
| `/#/b1g1-new` | Buy One Get One | |
| `/#/gift-products-new` | Gift Products | |
| `/#/ned-new` | NED Promo | |
| `/#/referral-codes-new` | Referral Codes | |
| `/#/abby-picks-new` | Abby Picks | Drag-drop reorder |
| `/#/bev-picks-new` | Bev Picks | Drag-drop reorder |
| `/#/top-picks-promo-new` | Top Picks Promo | Drag-drop reorder |

### CRM & Pelanggan
| Route | Halaman | Fitur |
|---|---|---|
| `/#/customers-new` | List Pelanggan | Filter segmentasi, read-only |
| `/#/transactions-new` | List Transaksi | Filter no. transaksi, read-only |
| `/#/abandoned-carts-new` | Abandoned Carts | |
| `/#/crm-members-new` | CRM Members | |
| `/#/crm-affiliates-new` | CRM Affiliates | |

### Inventory & Stok
| Route | Halaman |
|---|---|
| `/#/stock-movements-new` | Mutasi Stok |
| `/#/reports-new/inventory` | Laporan Inventory |

### Laporan
| Route | Halaman |
|---|---|
| `/#/reports-new/dashboard` | Laporan Dashboard |
| `/#/reports-new/sales` | Laporan Sales |
| `/#/reports-new/customer` | Laporan Customer |
| `/#/reports-new/transaction` | Laporan Transaksi |
| `/#/reports-new/revenue` | Laporan Revenue |
| `/#/seo-report-new` | Laporan SEO Live |

### Master Data
| Route | Halaman |
|---|---|
| `/#/brands-new` | Brand |
| `/#/brand-bulk-upload-logo-new` | Bulk Upload Logo Brand |
| `/#/brand-bulk-upload-banner-new` | Bulk Upload Banner Brand |
| `/#/tags-new` | Tag Produk |
| `/#/personas-new` | Persona |
| `/#/category-types-new` | Tipe Kategori |
| `/#/concerns-new` | Concern |
| `/#/concern-options-new` | Opsi Concern |
| `/#/profile-categories-new` | Kategori Profil |
| `/#/profile-category-options-new` | Opsi Kategori Profil |

### Ramadan Event
| Route | Halaman |
|---|---|
| `/#/ramadan-spin-prizes-new` | Spin Prizes |
| `/#/ramadan-recommendations-new` | Rekomendasi |
| `/#/ramadan-banners-new` | Banner Ramadan |
| `/#/ramadan-participants-new` | Peserta |

### Konten & System
| Route | Halaman |
|---|---|
| `/#/privacy-policy-new` | Privacy Policy (rich text editor) |
| `/#/tnc-new` | Term & Conditions |
| `/#/return-policy-new` | Return Policy |
| `/#/about-us-new` | About Us |
| `/#/contact-us-new` | Contact Us |
| `/#/faqs-new` | FAQ |
| `/#/settings-new` | Pengaturan Sistem |
| `/#/admins-new` | Manajemen Admin |
| `/#/activity-logs-new` | Activity Log |
| `/#/abeauties-squad-new` | Abeauties Squad |
| `/#/supabase-users-new` | Supabase Users |
| `/#/profile-new` | Profil Admin Login |

---

## Arsitektur & Pola Kode

### Struktur Modul Fitur

Setiap fitur di `src/features/<name>/` mengikuti pola yang sama:

```
features/discounts/
  types/
    discount.interface.ts   # interface DiscountListItem, DiscountDetail, dll.
    discount.enum.ts        # enum DiscountStatus, DiscountType, dll.
    index.ts                # export * dari semua types
  services/
    discount.service.ts     # axios CRUD: list, getById, create, update, remove
  hooks/
    useDiscounts.ts         # useQuery / useMutation wrappers
  schemas/
    discount-form.schema.ts # Zod schema + type inferensi
  utils/
    normalize.ts            # reshape raw API response → typed interface
    normalize.test.ts       # unit tests untuk normalize
    formatters.ts           # format tanggal, status, label
    formatters.test.ts
  components/
    DiscountListTable.tsx
    DiscountFormDialog.tsx
    DiscountFiltersCard.tsx
  pages/
    DiscountListPage.tsx    # dibungkus <AppShell>
    DiscountFormPage.tsx
  index.ts                  # barrel
```

### Pola Halaman

Setiap halaman menggunakan `AppShell` + `PageContainer` + `PageHeader`:

```tsx
import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';

const MyListPage = () => (
  <AppShell>
    <PageContainer>
      <PageHeader
        title="Nama Halaman"
        description="Deskripsi singkat."
        actions={<Button>Tambah</Button>}
      />
      {/* konten */}
    </PageContainer>
  </AppShell>
);

export default MyListPage;
```

### Pola Hook (Tanstack Query)

```ts
// hooks/useDiscounts.ts
export const useDiscounts = (params: DiscountListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.discounts.list(params),
    queryFn: () => discountService.list(params),
  });

export const useCreateDiscount = () =>
  useMutation({
    mutationFn: discountService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.discounts.all });
      toast.success('Diskon berhasil ditambahkan');
    },
    onError: (err) => toast.error(extractAxiosErrorMessage(err, 'Gagal menambahkan diskon')),
  });
```

### Pola Service

```ts
// services/discount.service.ts
import { axiosClient } from '@/config/axios';
import type { ServeWrapper, AdonisPaginatedPayload } from '@/lib/api-types';
import type { Discount, DiscountFormPayload, DiscountListQuery } from '../types';

export const discountService = {
  async list(params: DiscountListQuery): Promise<AdonisPaginatedPayload<Discount>> {
    const res = await axiosClient.get<ServeWrapper<AdonisPaginatedPayload<Discount>>>(
      '/admin/discounts',
      { params },
    );
    return res.data.serve;
  },

  async create(payload: DiscountFormPayload): Promise<Discount> {
    const res = await axiosClient.post<ServeWrapper<Discount>>('/admin/discounts', payload);
    return res.data.serve;
  },
};
```

---

## Komponen Shared

Semua di `src/components/common/`. Import via:
```ts
import { DataTable, PageHeader, ConfirmDialog } from '@/components/common';
```

### `DataTable`
Tanstack Table dengan pagination server-side:
```tsx
<DataTable
  columns={columns}
  data={items}
  isLoading={isLoading}
  isError={isError}
  // Server-side pagination:
  manualPagination
  pageCount={Math.ceil(total / perPage)}
  pagination={{ pageIndex: page - 1, pageSize: perPage }}
  onPaginationChange={({ pageIndex, pageSize }) => {
    setPage(pageIndex + 1);
    setPerPage(pageSize);
  }}
/>
```

### `ReorderDialog<T>`
Dialog reorder drag-drop generik:
```tsx
<ReorderDialog
  open={reorderOpen}
  onOpenChange={setReorderOpen}
  items={picks}
  getKey={(item) => item.id}
  getLabel={(item) => item.name}
  onSave={(reordered) => reorderMutation.mutate(reordered)}
  isSaving={reorderMutation.isPending}
/>
```

### `ConfirmDialog`
```tsx
<ConfirmDialog
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
  title="Hapus Diskon"
  description="Tindakan ini tidak bisa dibatalkan."
  onConfirm={() => deleteMutation.mutate(selectedId)}
  isPending={deleteMutation.isPending}
/>
```

### `RichTextEditor`
```tsx
<RichTextEditor value={content} onChange={setContent} />
```

### State komponen (LoadingState / EmptyState / ErrorState)
```tsx
if (isLoading) return <LoadingState />;
if (isError)   return <ErrorState />;
if (!data?.length) return <EmptyState message="Belum ada data" />;
```

---

## API Conventions

### Base URL

Dikonfigurasi via `VITE_API_URL` env var. Default: `http://localhost:3333/api/v1`.

### Auth Flow

1. `POST /auth/login-admin` dengan `{ email, password }`
2. Response: `{ message, serve: { data: user, token, permissions, menu_access } }`
3. Token disimpan di `localStorage` key `auth-session` (Zustand persist)
4. Axios interceptor baca token otomatis dari `localStorage` dan attach sebagai `Authorization: Bearer <token>`
5. Jika 401, interceptor hapus session dan redirect ke `/login`

### Response Wrapper

```ts
// Kebanyakan endpoint:
{ message?: string; serve: T }

// Enum, reorder, delete — serve berisi data langsung

// Pagination standar (Adonis):
serve: {
  data: T[];
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
}
```

**Tipe tersedia di `src/lib/api-types.ts`:**
```ts
import type { ServeWrapper, AdonisPaginatedPayload } from '@/lib/api-types';
```

### Endpoint Tanpa `serve` Wrapper

Empat endpoint ini mengembalikan `{ meta, data }` langsung (bukan `serve`):
- `GET /admin/ramadan-spin-prizes`
- `GET /admin/buy-one-get-one`
- `GET /admin/gift-products`
- `GET /admin/referral-codes`

Gunakan helper:
```ts
import { toPaginated } from '@/lib/meta-pagination';
const result = toPaginated(response.data); // → AdonisPaginatedPayload<T>
```

### Reorder Endpoints

```ts
POST /admin/<resource>/update-order
Body: { updates: Array<{ id: number; order: number }> }
```

### Error Handling

```ts
import { extractAxiosErrorMessage } from '@/lib/axios-error';

onError: (err) => toast.error(extractAxiosErrorMessage(err, 'Operasi gagal'))
```

---

## State Management

### Auth Store (`src/stores/auth.store.ts`)

```ts
import { useAuthStore } from '@/stores/auth.store';

const { user, token, isAuthenticated, setSession, clearSession } = useAuthStore();
```

Persisted ke `localStorage` key `auth-session`. Shape:
```json
{
  "state": {
    "token": "...",
    "user": { "id": 1, "name": "...", "role": 1, ... },
    "permissions": { "can_manage_products": true, ... },
    "menuAccess": { "dashboard": true, ... },
    "isAuthenticated": true
  },
  "version": 0
}
```

### Theme Store (`src/stores/theme.store.ts`)

```ts
import { useThemeStore } from '@/stores/theme.store';

const { theme, setTheme } = useThemeStore(); // theme: 'light' | 'dark'
```

### Aturan State

- **Server state** → Tanstack Query (`useQuery`, `useMutation`)
- **Client/UI state** → React `useState` lokal
- **Global persistent state** → Zustand (`auth`, `theme`)
- **Jangan** pakai `createContext` / `useContext` di feature layer

---

## Testing

### Unit Tests (Vitest)

Test dicolocate bersama kode di `src/**/*.test.ts`. Jalankan:

```bash
npm test -- --run      # 497 tests, 45 files, single-shot
npm test               # watch mode
npm run test:ui        # UI browser
```

**Coverage area:**
- `src/lib/` — `axios-error`, `meta-pagination`
- Semua normalizer fitur dengan branching non-trivial
- Payload builders (`flash-sale`, `products/form-payload`)
- Formatters & date-range utils
- Status derivation (discounts, vouchers)

**Menulis test baru:**
```ts
// src/features/brands/utils/normalize.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeBrand } from './normalize';

describe('normalizeBrand', () => {
  it('returns fallback for null input', () => {
    expect(normalizeBrand(null)).toEqual({ id: 0, name: '' });
  });
});
```

### Smoke Test

Hit semua GET endpoint live dan validasi response shape:
```bash
# Backend harus running di localhost:3333
node scripts/smoke-test-v15.mjs
# → PASS: 47  WARN: 0  FAIL: 0
```

### E2E Tests (Cypress)

```bash
# Dev server harus running dulu
npm run dev

# Headless (untuk CI)
npm run cy:run

# GUI interaktif (untuk debug)
npm run cy:open
```

**Specs tersedia:**
| File | Tests | Coverage |
|---|---|---|
| `cypress/e2e/auth.cy.ts` | 5 | Login, logout, redirect unauthenticated |
| `cypress/e2e/navigation.cy.ts` | 9 | Sidebar nav semua section |
| `cypress/e2e/pages.cy.ts` | 15 | Key pages render tanpa error |

**Custom command `cy.login()`:**

Melakukan login via API (bukan UI) dan set session ke `localStorage`. Menggunakan `cy.session()` sehingga token di-cache antar test dalam satu run.

```ts
// Pakai di beforeEach:
beforeEach(() => {
  cy.login();
  cy.visit('/#/dashboard');
});
```

**Credentials E2E** dikonfigurasi di `cypress.config.ts` bagian `env`:
```ts
env: {
  apiUrl: 'http://localhost:3333/api/v1',
  adminEmail: 'abbynbev@gmail.com',
  adminPassword: 'Secret123!',
}
```

---

## Menambah Fitur Baru

Ikuti urutan ini untuk menambah modul fitur baru:

### 1. Types

```ts
// src/features/coupons/types/coupon.interface.ts
export interface Coupon {
  id: number;
  code: string;
  discount: number;
  isActive: boolean;
}

// src/features/coupons/types/coupon.enum.ts
export enum CouponStatus { Active = 'active', Inactive = 'inactive' }

// src/features/coupons/types/index.ts
export * from './coupon.interface';
export * from './coupon.enum';
```

### 2. Normalizer

```ts
// src/features/coupons/utils/normalize.ts
import type { Coupon } from '../types';

export function normalizeCoupon(raw: Record<string, unknown>): Coupon {
  return {
    id: Number(raw.id ?? 0),
    code: String(raw.code ?? ''),
    discount: Number(raw.discount ?? 0),
    isActive: Boolean(raw.is_active),
  };
}
```

### 3. Service

```ts
// src/features/coupons/services/coupon.service.ts
import { axiosClient } from '@/config/axios';
import type { ServeWrapper, AdonisPaginatedPayload } from '@/lib/api-types';
import type { Coupon } from '../types';

export const couponService = {
  async list(): Promise<AdonisPaginatedPayload<Coupon>> {
    const res = await axiosClient.get<ServeWrapper<AdonisPaginatedPayload<Coupon>>>('/admin/coupons');
    return res.data.serve;
  },
};
```

### 4. Hooks

```ts
// src/features/coupons/hooks/useCoupons.ts
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { couponService } from '../services/coupon.service';

export const useCoupons = () =>
  useQuery({
    queryKey: QUERY_KEYS.coupons.list(),
    queryFn: couponService.list,
  });
```

### 5. Zod Schema (jika ada form)

```ts
// src/features/coupons/schemas/coupon-form.schema.ts
import { z } from 'zod';

export const couponFormSchema = z.object({
  code: z.string().min(3, 'Kode minimal 3 karakter'),
  discount: z.number().min(1).max(100),
});

export type CouponFormValues = z.infer<typeof couponFormSchema>;
```

### 6. Page

```tsx
// src/features/coupons/pages/CouponListPage.tsx
import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';

const CouponListPage = () => (
  <AppShell>
    <PageContainer>
      <PageHeader title="Coupon" description="Kelola coupon." />
      {/* DataTable, dll. */}
    </PageContainer>
  </AppShell>
);

export default CouponListPage;
```

### 7. Router

```ts
// src/router/index.tsx
const CouponListPage = lazy(() => import('@/features/coupons/pages/CouponListPage'));

// Di dalam createRoutesFromElements:
{protectedRoute('/coupons-new', CouponListPage)}
```

### 8. Sidebar

```ts
// src/layouts/SidebarNav.tsx — tambahkan ke grup Marketing:
{ label: 'Coupon', path: '/coupons-new' }
```

### 9. Query Keys

```ts
// src/constants/query-keys.constant.ts
coupons: {
  all: ['coupons'] as const,
  list: () => [...QUERY_KEYS.coupons.all, 'list'] as const,
  detail: (id: number) => [...QUERY_KEYS.coupons.all, 'detail', id] as const,
},
```

### 10. Verifikasi

```bash
npx tsc --noEmit -p tsconfig.app.json   # harus 0 error
node scripts/smoke-test-v15.mjs          # tambahkan endpoint baru ke script jika perlu
```

---

## Konvensi Kode

### TypeScript

- **Zero `any`** — gunakan `unknown` jika tipe tidak diketahui
- **Semua interface dan enum** ada di `features/<x>/types/` — tidak di service, utils, atau komponen
- Prop interface boleh lokal di komponen; pindah ke `types/` jika dipakai cross-file
- Payload API pakai `snake_case` di wire; TypeScript interface pakai `camelCase`. Service yang mengkonversi

### DateTime

API mengembalikan ISO string dengan `+07:00`. Gunakan helper dari `@/utils/timezone`:

```ts
import { toWib, formatWib, WIB_TZ } from '@/utils/timezone';

const wib = toWib('2024-01-15T10:00:00+07:00');    // → Moment object WIB
const display = formatWib('2024-01-15T10:00:00+07:00', 'DD MMM YYYY HH:mm'); // → "15 Jan 2024 10:00"
```

Form input datetime pakai `type="datetime-local"` (format `YYYY-MM-DDTHH:mm`).

### Routing (Slug vs ID)

| Pakai **slug** di URL | Pakai **numeric ID** di URL |
|---|---|
| Brand, Tag, Persona | ProfileCategory, Settings |
| CategoryTypes, Concern | FAQ, Admin, Ramadan |

### Lazy Loading

Semua route **wajib** di-lazy load:

```ts
// ✅ Benar
const MyPage = lazy(() => import('@/features/my-feature/pages/MyPage'));

// ❌ Salah
import MyPage from '@/features/my-feature/pages/MyPage';
```

### Memoization

```ts
// Gunakan React.memo untuk komponen dialog/panel berat
export const MyDialog = memo(MyDialogComponent);

// Gunakan useMemo untuk derived state yang mahal
const filtered = useMemo(() => items.filter(...), [items, filters]);
```

### Upload File

Gunakan `uploadService` dari `@/features/products/services`:

```ts
import { uploadService, UPLOAD_FOLDERS } from '@/features/products/services';

const url = await uploadService.upload(file, UPLOAD_FOLDERS.brandsLogos);
// → returns CloudFront URL string
```

Folder yang tersedia: `products`, `productsGift`, `brandsLogos`, `brandsBanners`, `banners`, `avatars`.

### Toast Notifications

```ts
import { toast } from 'sonner';

toast.success('Data berhasil disimpan');
toast.error('Terjadi kesalahan');
toast.loading('Memproses...');
```

### Sidebar Permission Gating

Entri sidebar bisa dibatasi berdasarkan permission:

```ts
// src/layouts/SidebarNav.tsx
{
  label: 'Admin Management',
  path: '/admins-new',
  requires: (perms) => perms?.is_admin === true,
}
```

`undefined` = tampil untuk semua. Admin role (`isAdmin`) bypass semua gate.

---

## Known Quirks & Gotchas

### 1. Auth Response Struktur Dalam

```
POST /auth/login-admin
→ { message, serve: { data: user, token, permissions, menu_access } }
```
User ada di `serve.data`, **bukan** `serve.user`.

### 2. Banner Response Dobel Wrapper

`GET /admin/banners` mengembalikan `{ data: { serve: [...] } }` — ada ekstra wrapper `data` yang tidak ada di endpoint lain. Sudah ditangani di `banner.service.ts`.

### 3. Banner Items Berisi Raw Adonis ORM

Data banner dari list endpoint mengandung `$attributes`, `$original`, dll. Data asli ada di `$attributes`. Sudah dinormalisasi via `normalizeBanner()` di service.

### 4. Empat Endpoint Tanpa `serve`

`/ramadan-spin-prizes`, `/buy-one-get-one`, `/gift-products`, `/referral-codes` mengembalikan `{ meta, data }`. Gunakan `toPaginated()` dari `@/lib/meta-pagination`.

### 5. Product Variants Wajib Ada `id` Saat Update

Kalau update produk tanpa menyertakan `variant.id`, backend akan INSERT ulang (bukan UPDATE) → unique constraint error. Selalu preserve ID varian yang ada.

### 6. Upload Response

`POST /upload` mengembalikan `{ signedUrl: "https://d2ntedlnuwws1k.cloudfront.net/..." }`. Simpan `signedUrl` sebagai URL publik di `medias[].url`.

### 7. Rate Limit Auth

`/auth/login-admin` dan `/auth/forgot` dibatasi 5 request per window. Jika kena 429, response berisi `serve: { limit, remaining, availableIn }`.

### 8. `perPage` vs `per_page`

Response pagination: field `perPage` (camelCase). Query string: `per_page` (snake_case).

### 9. CRM Normalizer — Typo Backend

`crm/normalize.ts` membaca key `profilCompletion` (typo dari backend), bukan `profileCompletion`. Sudah terkunci dengan test. Jika backend membenahi typo, update normalizer.

### 10. Dev Server Port

Dev server default di port **5173**. Cypress dikonfigurasi untuk `http://localhost:5173`. Pastikan tidak ada proses lain di port ini saat menjalankan E2E.

---

## Lisensi

Internal use only — SJA Textile / Abby n Bev.
