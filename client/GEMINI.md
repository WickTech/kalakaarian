# Kalakaarian Client — Gemini CLI Context

> Read root `GEMINI.md` first for repo-wide rules.

## Stack
React 18 + TypeScript (strict) + Vite + Tailwind 3 + shadcn/ui + TanStack Query v5 + React Hook Form + Zod

## Key patterns
- Server state: TanStack Query (`useQuery` / `useMutation`) — not useState for async data
- Forms: React Hook Form + Zod schema validation
- Auth token: stored under key `kalakariaan_token` (historical typo — keep it)
- API calls: `client/src/lib/api.ts` — all functions return typed interfaces, no `any`
- Auth header: see `client/src/api/axios.ts` for the Bearer token interceptor pattern

## Do not hand-edit
`src/components/ui/**` are shadcn/ui generated files — exclude from lint, never edit manually.

## PWA
- Config: `client/vite.config.ts` (VitePWA plugin, Workbox caching)
- Service worker registration: `client/src/main.tsx` (`registerSW({ immediate: false })`)
- Offline fallback: `client/public/offline.html`
- Icons: 192×192 and 512×512 in `client/public/`

## Commands (run from repo root)
```
npm run client           # vite dev server (localhost:5173)
cd client && npm run build
cd client && npm run lint
cd client && npm run test
cd client && npm run test:e2e
```
