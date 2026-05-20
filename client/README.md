# Kalakaarian — Client

React 18 + Vite 5 + TypeScript frontend for the Kalakaarian creator-brand marketplace.

## Stack

| Tool | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite 5 | Build + dev server |
| Tailwind CSS 3 + shadcn/ui | Design system |
| TanStack Query v5 | Server state, caching, refetch |
| React Router DOM v6 | Client-side routing |
| React Hook Form + Zod | Forms + validation |
| Vitest | Unit tests |
| Playwright | E2E tests |

## Dev

```bash
# From repo root
npm run client       # Vite dev server at http://localhost:5173

# Or point at a deployed API
VITE_API_URL=https://kalakaarian-server.vercel.app/api npm run client
```

For a full local stack (client + serverless API together):
```bash
vercel dev           # from repo root — reads vercel.json
```

## Build

```bash
cd client && npm run build    # outputs to client/dist/
cd client && npm run lint
cd client && npm run test
cd client && npm run test:e2e
```

## Key Conventions

- **Never call fetch/axios directly** — use `src/lib/api.ts` (auto-attaches JWT, 401 → `/login`)
- **Auth token key**: `kalakariaan_token` in localStorage (preserve the typo — renaming logs everyone out)
- **Never re-apply the 5% platform margin** — server already includes it in all brand-facing reads
- **Never hand-edit `src/components/ui/`** — those are shadcn primitives, regenerate via CLI
- **200-line file limit** — split pages by section when approaching the limit

## Folder Structure

```
src/
├── api/              # axios instance with JWT + 401 handling
├── components/       # shared UI components
│   ├── account/      # InlineEditField and account-page components
│   ├── creator-onboarding/  # 11 wizard step components (shared across email + Google paths)
│   ├── marketplace/  # MarketplaceToolbar, etc.
│   ├── profile/      # ProfileGallery, OwnerActionsBar, CommercialsPricingSection
│   └── ui/           # shadcn primitives — do not hand-edit
├── hooks/            # useAuth, useCart, useRealtimeCampaignCreator
├── lib/              # api.ts (typed client), queryKeys.ts, influencerMappers.ts
├── pages/            # one default export per page
│   ├── account/      # /account/* — Personal Info, Security, Connected Apps, etc.
│   └── ...
└── styles/           # globals.css, design tokens
```

## Auth Flow

1. Login → `kalakariaan_token` (Supabase access JWT, 1hr TTL) + `kalakariaan_user` stored in localStorage
2. `api.ts` attaches `Authorization: Bearer <token>` to every request
3. On 401 → localStorage cleared → redirect to `/login`
4. `useAuth` hook reads from localStorage + exposes `user`, `isSuperAdmin`, `viewAs`
5. `ProtectedRoute`, `BrandRoute`, `InfluencerRoute` guard pages by role + `onboarding_completed` flag

## Business Rules (don't break these)

| Rule | Where enforced |
|---|---|
| 5% platform margin already in API response | `applyPlatformMargin()` runs server-side — display as-is |
| 8% platform fee at checkout | Server-only, in Razorpay order creation |
| Tier enum: `nano/micro/macro/celeb` | No `mid`, no `mega` |
| Gender enum: `male/female/non_binary/prefer_not_to_say` | Exact values only for `?gender=` |
| Max 3 niches per creator | Enforced in registration wizard, Google onboarding, and account settings |
| Gallery max 6 images | `MAX_GALLERY = 6` in `ProfileGallery.tsx` |
| Commercials locked 6 months | First-time setup bypasses lock; lock activates once rows exist |
