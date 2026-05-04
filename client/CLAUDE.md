# Kalakaarian Client — Claude Code Notes

> Frontend (Vite + React 18 + TypeScript + Tailwind + shadcn/ui).
> Read root `../CLAUDE.md` first for repo-wide rules.

## Stack
- React 18 + TypeScript (strict)
- Vite 5 (`vite.config.ts`)
- Tailwind 3 + shadcn/ui (`src/components/ui/*` — generated; do not hand-edit, regenerate via shadcn CLI)
- React Router DOM v6
- TanStack Query v5 for server state
- React Hook Form + Zod for forms
- Axios via shared `src/api/axios.ts` instance
- Vitest + Playwright for tests

## Rules
- **200-line file limit** applies here too. Split big pages by section.
- **Never call fetch/axios directly** — always use the `api` instance from `src/api/axios.ts` so the JWT header and 401 handling stay consistent.
- **Never read or write secrets in client code.** Vite bakes envs into the bundle. Public-only vars get the `VITE_` prefix.
- **Don't hand-edit `src/components/ui/*`.** Those are shadcn primitives. Re-add via `npx shadcn-ui@latest add <component>` if customisation is needed.
- **Tailwind tokens before custom CSS.** If a colour/spacing token doesn't exist, add it to `tailwind.config.ts`, don't sprinkle hex values.
- Keep `data/` files (mock seed data) typed against the same interfaces in `lib/api.ts`.

## Auth Token
- Storage key: **`kalakariaan_token`** (note the historical typo — preserve it; renaming silently logs everyone out).
- Set/cleared inside `src/api/axios.ts` interceptors and the auth context.
- All requests through the `api` instance auto-attach `Authorization: Bearer <token>`.
- 401 responses route the user to `/login`.

## API Base URL
- Single source: `import.meta.env.VITE_API_URL`.
- Local default: `http://localhost:4000/api` (matches root `.env.example`).
- Production: set in Vercel project env (`https://<project>.vercel.app/api` or custom domain).
- ⚠️ `src/lib/api.ts` currently has a hard-coded fallback `https://kalakaarian-server.vercel.app`. Prefer the value from `VITE_API_URL`; if you change envs, refresh `lib/api.ts` too.

## Server Contracts You Must Honour
| Topic | Contract | UI implication |
|---|---|---|
| Influencer pricing | Server returns `pricing` already including the **5% platform margin**. | Display as-is. Do **not** multiply again. |
| Influencer presence | Server returns `isOnline: boolean` + `lastSeenAt: ISOString`. | Show a green dot on cards when `isOnline`; otherwise show "last seen <relative time>". |
| Gender filter | Allowed values: `male \| female \| non_binary \| prefer_not_to_say`. | Don't send free-form strings to `?gender=`; the server drops anything else silently. |
| Pagination | Server caps `limit` to 100. | Page sizes >100 won't error but won't return more. |
| Tier enum | Server enum: `nano \| micro \| macro \| celeb`. | No `mid`, no `mega`. Use these exact values when sending `?tier=` or membership tier. |
| Contact form | Public POST is rate-limited (5 / hour / IP). | Surface a friendly toast on 429; back off, don't retry. |

## Routing & Pages
- Pages live in `src/pages/*`. One page = one default export. Co-locate page-specific components in `src/pages/<Page>/`.
- Auth-guarded routes wrap their element with the auth guard from `src/components/auth/*`.
- Always set a `<title>` (via `document.title` effect or a small head helper) when introducing a new page.

## Forms
- React Hook Form + Zod resolver. Schema lives next to the form.
- Phone numbers: validate with the same regex used by the server OTP route.
- Image uploads: send pre-signed/base64 to the server endpoint that already exists (`PUT /api/influencers/:id/image`); don't introduce a new flow.

## Testing
- Unit: Vitest (`npm run test`). Co-locate `*.test.tsx` next to the component.
- E2E: Playwright (`npm run test:e2e`). Fixtures in `playwright-fixture.ts`.
- Mock the `api` instance in unit tests; never hit the real network.

## Build & Deploy
- `npm run build` → `dist/` (Vite). Vercel uploads `dist/` as static.
- Run `npm run lint && npm run build` before pushing.
- Bundle size budget: keep first-load JS under ~250 KB gzipped. If a new dep blows past it, code-split or replace.

## Common Mistakes to Avoid
- ❌ Storing JWT in a cookie without `Secure; HttpOnly; SameSite` — we use localStorage on purpose, don't half-migrate.
- ❌ Adding a new shadcn component by copy-pasting from another repo. Use the CLI so styles align with `tailwind.config.ts`.
- ❌ Calling `useEffect` for data fetching when `useQuery`/`useMutation` already gives you cache + error + loading.
- ❌ Hard-coding `http://localhost:4000` anywhere. Always go through the `api` instance.
- ❌ Showing raw influencer pricing fields and applying your own markup. The server already did it.
