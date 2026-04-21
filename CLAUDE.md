# CMS Admin — Abby n Bev

E-commerce CMS admin panel. Mid-migration from v1 (Ant Design) → v1.5 (Shadcn + Tailwind).

## Stack (v1.5 mandatory)

- TypeScript + React 18 (function components)
- Vite + SWC
- Tailwind 4 + Shadcn UI (Radix primitives)
- Tanstack Query (server state) + Zustand (client state)
- React Hook Form + Zod
- `react-router-dom` via `createHashRouter` (URLs are `/#/path`)
- Axios via `@/config/axios` (auto-attaches bearer token from Zustand auth store)
- Tiptap (rich text), Recharts (charts), moment-timezone (WIB date handling)

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
  features/           # v1.5 feature modules (26+ features, all code-complete)
    <feature>/
      types/          # interface + enum
      services/       # axios calls, normalizers
      hooks/          # useQuery / useMutation
      schemas/        # Zod form schemas
      utils/          # normalize, formatters
      components/     # feature-specific UI
      pages/          # route-level pages
      index.ts        # barrel
  components/
    common/           # shared shadcn-based (PageContainer, DataTable, ConfirmDialog, RichTextEditor, etc.)
    ui/               # shadcn-generated primitives
  layouts/            # AppShell + SidebarNav + HeaderActions + MainLayout (v1.5)
  layout/             # legacy Ant Design layout (still used by /MasterPage old routes)
  config/             # axios, etc.
  constants/          # QUERY_KEYS
  stores/             # Zustand (auth)
  hooks/              # legacy + some shared (useThemeStore)
  lib/                # utilities (cn, meta-pagination helper)
  pages/              # legacy v1 pages (not v1.5)
  components/(Forms|Tables|Transaction|Charts|Uploads|Panels|Report)/  # legacy v1 - do not import from features
```

**Rules:**
- v1.5 features NEVER import from `components/Forms|Tables|etc.`, `api/`, `services/api/`, `utils/helper`, `layout/` (old)
- Legacy v1 still alive at old routes (wrapped by `src/pages/MasterPage.tsx`)
- URLs with `-new` suffix are v1.5 routes (e.g. `/discounts-new`, `/tags-new`)

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
- Normalizer utilities: each feature has `utils/normalize.ts` that handles camelCase/snake_case ambiguity
- Known endpoint quirks: see `memory/project_api_quirks.md`

## Naming + patterns

- **Slug vs ID for CRUD detail URL**: Brand/Tag/Persona/CategoryTypes/Concern use `slug`. ProfileCategory/Settings/FAQ/Admin/Ramadan/etc. use numeric `id`.
- **Payload casing**: usually snake_case on wire (`started_at`), camelCase in TypeScript interfaces (`startedAt`). Services convert.
- **Datetime**: API returns ISO with `+07:00`. Form inputs use `datetime-local` (YYYY-MM-DDTHH:mm). Use `moment-timezone` with `WIB_TZ` for conversion (see `@/utils/timezone`).

## AppShell usage

```tsx
import { AppShell } from '@/layouts';

const MyPage = () => (
  <AppShell>
    <PageContainer>
      <PageHeader title="..." description="..." actions={<Button>...</Button>} />
      ...
    </PageContainer>
  </AppShell>
);
```

AppShell provides: left sidebar (`SidebarNav`) + top header (`HeaderActions` with profile + theme toggle). Don't use legacy `src/layout/MainLayout` in v1.5 code.

## Adding a new feature checklist

1. `src/features/<name>/types/` — interface + list query + payload
2. `src/features/<name>/utils/normalize.ts` — shape the API response
3. `src/features/<name>/services/<name>.service.ts` — axios CRUD
4. `src/features/<name>/hooks/use<Name>.ts` — Tanstack Query wrappers
5. `src/features/<name>/schemas/<name>-form.schema.ts` — Zod (if form)
6. `src/features/<name>/components/` — ListTable + FormDialog
7. `src/features/<name>/pages/<Name>ListPage.tsx` — wrapped in `<AppShell>`
8. Wire lazy import + Route in `src/App.tsx`
9. Add entry to `SidebarNav.tsx` + `QUERY_KEYS` constant
10. Run `npx tsc --noEmit` and `node scripts/smoke-test-v15.mjs`

## Smoke test

`scripts/smoke-test-v15.mjs` hits all 47 GET endpoints + 5 async report runs. Run before asking user to UI-test. All checks must pass before cleanup (Phase 6).

## Status: v1.5 migration

Phase 3 + 4 + 5 all batches done. 26+ features migrated. See `memory/project_v15_progress.md` for full feature table + deferred sub-features (drag-drop, CSV imports, picker dialogs, chart detail modals, etc.).

Next: Phase 6 — user UI-tests, then delete legacy (`src/pages/MasterPage.tsx`, `src/layout/`, `src/components/(Forms|Tables|Transaction|Charts|Report|Panels)/`, `src/api/`, `src/utils/helper.ts`, `src/services/api/`, `src/hooks/(discount|voucher|flashsale|ramadhan|referral|useFormSale|useTableSale|promotions)`) + uninstall `antd` + `@ant-design/icons` + `react-quill`.
