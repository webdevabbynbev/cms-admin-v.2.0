# CMS Admin — Abby n Bev

E-commerce CMS admin panel. v1.5 migration complete (Shadcn + Tailwind 4, no more Ant Design).

## Stack

- TypeScript + React 18 (function components)
- Vite + SWC
- Tailwind 4 + Shadcn UI (Radix primitives)
- Tanstack Query (server state) + Zustand (client state)
- React Hook Form + Zod
- `react-router-dom` via `createHashRouter` (URLs are `/#/path`)
- Axios via `@/config/axios` (auto-attaches bearer token from Zustand auth store)
- Tiptap (rich text), Recharts (charts), moment-timezone (WIB date handling)
- Sonner (toast), Lucide (icons)

## Commands

```bash
npm run dev                # vite dev server (default 5173)
npm run dev:staging        # staging mode
npx tsc --noEmit -p tsconfig.app.json   # full type-check
node scripts/smoke-test-v15.mjs          # hit ~50 API endpoints, check response shapes
```

No ESLint pre-commit. Just ensure `tsc` clean.

## Directory structure

```
src/
  App.tsx              # compose root (theme effect + init + providers + router)
  main.tsx             # StrictMode + App
  features/            # 37 feature modules
    <feature>/
      types/           # interface + enum (single source of truth for shapes)
      services/        # axios calls
      hooks/           # useQuery / useMutation
      schemas/         # Zod form schemas
      utils/           # normalize, formatters, feature-specific helpers
      stores/          # zustand (rare, e.g. products/csv-import)
      components/
      pages/
      index.ts         # barrel
  components/
    common/            # PageContainer, PageHeader, DataTable, ConfirmDialog,
                       # RichTextEditor, SortableList, ReorderDialog,
                       # LoadingState, EmptyState, ErrorState
    ui/                # shadcn-generated primitives
    ErrorBoundary/
  config/              # axios, query-client
  constants/           # QUERY_KEYS, countries, uploadPaths
  layouts/             # AppShell, MainLayout, SidebarNav, HeaderActions,
                       # ChangePasswordDialog, FullLayout
  lib/                 # cn (utils.ts), meta-pagination, axios-error
  providers/           # AppProviders (QueryClient + Tooltip + ErrorBoundary + Toaster + Devtools)
  router/              # createHashRouter + lazy route definitions + legacy redirects
  stores/              # zustand root-level (auth.store, theme.store)
  styles/              # theme.css, globals.css
  types/               # (empty / reserved)
  utils/               # timezone, env, analytics/, pwa/
```

**Rules:**
- Interfaces & enums live in `features/<x>/types/` — not in services, utils, or components.
- Components export their own prop interfaces locally; promote to `types/` if used cross-file.
- Zustand state-shape interfaces stay with the store.

## API conventions

- Base URL: `http://localhost:3333/api/v1` (config in `src/config/axios.ts`)
- Auth: admin login at `POST /auth/login-admin` with `{email, password}`. Token + user in `response.data.serve.token` and `.serve.data`
- Standard wrapper: `{ message?, serve: {...} }` — most endpoints
- **Exceptions with `{meta, data}` shape** (no `serve` wrapper):
  - `/admin/ramadan-spin-prizes`
  - `/admin/buy-one-get-one`
  - `/admin/gift-products`
  - `/admin/referral-codes`
  - Handled via `src/lib/meta-pagination.ts` helper (`toPaginated()`)
- Pagination (Adonis standard): `{data, total, perPage, currentPage, lastPage, firstPage}`
- Reorder endpoints follow `POST /admin/<resource>/update-order` with `{ updates: [{id, order}] }`.
- Axios errors: use `extractAxiosErrorMessage(err, fallback)` from `@/lib/axios-error`.
- Known endpoint quirks: see `memory/project_api_quirks.md`

## Naming + patterns

- **Slug vs ID for CRUD detail URL**: Brand/Tag/Persona/CategoryTypes/Concern use `slug`. ProfileCategory/Settings/FAQ/Admin/Ramadan/etc. use numeric `id`.
- **Payload casing**: usually snake_case on wire (`started_at`), camelCase in TypeScript interfaces (`startedAt`). Services convert.
- **Datetime**: API returns ISO with `+07:00`. Form inputs use `datetime-local` (YYYY-MM-DDTHH:mm). Use `moment-timezone` with `WIB_TZ` for conversion (see `@/utils/timezone`).
- **Permission-gated sidebar**: `src/layouts/SidebarNav.tsx` uses `PermPredicate` per group/item — fail-open (undefined predicate = show). Admin bypasses all gates via `isAdmin`.

## AppShell usage

```tsx
import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';

const MyPage = () => (
  <AppShell>
    <PageContainer>
      <PageHeader title="..." description="..." actions={<Button>...</Button>} />
      ...
    </PageContainer>
  </AppShell>
);
```

AppShell provides: left sidebar (`SidebarNav`) + top header (`HeaderActions` with profile + theme toggle + change-password dialog).

## Shared UI components

- **`DataTable`** — Tanstack Table + pagination, supports `manualPagination` for server-side paging.
- **`ReorderDialog<T>`** — generic reorder dialog (used by Picks, Home Banner, Flash Sale list reorder).
- **`SortableList<T>`** — native HTML5 drag sortable list primitive.
- **`ConfirmDialog`** — destructive action confirmation.
- **`RichTextEditor`** — Tiptap wrapper.

## Adding a new feature checklist

1. `src/features/<name>/types/` — interface + enum
2. `src/features/<name>/utils/normalize.ts` — shape the API response
3. `src/features/<name>/services/<name>.service.ts` — axios CRUD
4. `src/features/<name>/hooks/use<Name>.ts` — Tanstack Query wrappers
5. `src/features/<name>/schemas/<name>-form.schema.ts` — Zod (if form)
6. `src/features/<name>/components/` — ListTable + FormDialog
7. `src/features/<name>/pages/<Name>ListPage.tsx` — wrapped in `<AppShell>`
8. Add lazy import + Route in `src/router/index.tsx` (use `protectedRoute(path, Component)` helper)
9. Add entry to `SidebarNav.tsx` (with optional `requires` predicate) + `QUERY_KEYS` constant
10. Run `npx tsc --noEmit` and `node scripts/smoke-test-v15.mjs`

## Smoke test

`scripts/smoke-test-v15.mjs` hits all GET endpoints + async report runs. Run before asking user to UI-test.

## Status

v1.5 migration: **100% complete**. 37 feature modules. Phase 6 cleanup done — no more Ant Design, no more legacy `src/pages/`, `src/api/`, `src/services/`. See `memory/project_resume_point.md` for the current state and `memory/project_v15_progress.md` for per-feature history.
