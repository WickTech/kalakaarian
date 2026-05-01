# Kalakaarian — v2 Target Architecture (India MVP, 0–50k users)

> Designed post-launch (after 2026-05-01). Scope: 0–50k MAU. Optimize for: cost, speed of iteration, scalability headroom to 200k MAU without re-architecture.
> Implementation roadmap: see `V2_MIGRATION_ROADMAP.md`. This doc is the **target picture**.

## 1. Why migrate (and why not bigger)

### Problems with v1 stack at scale
- **Express on Vercel serverless** has 10s cold starts on first req of cold instance; in-memory rate limiters are useless across instances; no persistent WebSockets for chat.
- **MongoDB** is fine for documents but our marketplace queries are heavily relational (campaigns ↔ proposals ↔ users ↔ memberships ↔ transactions). Joins are awkward, GST analytics are awkward.
- **No structured background jobs** — invoices, payment reminders, expiry sweeps are all inline in request handlers.
- **No real-time** — chat is poll-based, presence is stale.
- **Bundling client and server in one Vercel project** mixes deploys; build-times get longer with client growth.

### Why **not** Kubernetes / microservices
At 0–50k MAU we don't need it. K8s + microservices buys you scale-out and team-autonomy you don't yet need. They cost dev time and money. The v2 below buys you a 5–10× headroom on a single-team-friendly stack.

### Why **not** stay on Mongo
- Postgres + a managed provider (Supabase) gives us Realtime (chat), Row-Level Security, full-text search, and edge functions for free.
- Schema migrations are explicit (good for compliance audits, GST returns).
- Joins, transactions, and partial indexes are first-class.

## 2. Target stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 15 (App Router) PWA** + React Server Components | RSC for fast public pages (landing, marketplace, profile); client components for interactive flows; built-in PWA via `next-pwa`; same React mental model. |
| Hosting | **Vercel** (frontend + serverless API routes) | Already used; preview-per-PR; edge cache; image optimization. |
| API | Next.js Route Handlers + **server actions** for mutations | Co-locate API with UI; less boilerplate; type-safe. |
| Auth | **Clerk** OR **Supabase Auth** (lean Supabase Auth) | Built-in OAuth, OTP, MFA. Avoids hand-rolled JWT/refresh logic. Strong choice: **Supabase Auth** (one provider for DB + auth). |
| DB | **Supabase Postgres** (Pro tier, ~$25/mo) | Postgres 15+, automatic backups, branching, point-in-time restore. |
| ORM | **Drizzle** | Lightweight, SQL-first, TS-native, faster than Prisma. |
| Realtime | **Supabase Realtime** | WebSocket-based; row-change broadcasts; presence. Replaces poll-chat. |
| Background jobs | **Inngest** (free tier 50k steps/mo) or **QStash** | Reliable retries, cron, fan-out. Replaces inline async-not-awaited. |
| Object storage | **Cloudflare R2** | $0.015/GB, no egress fees (huge in India). |
| Email | **Resend** | Already used. |
| Payments | **Razorpay** (unchanged) | India-default; webhook + Payouts API for influencer payouts in v2. |
| Search | Postgres `pg_trgm` + `tsvector` (v2.0). Move to **Meilisearch** (self-host on Fly.io ~$5/mo) at >100k profiles. | Tier appropriate. |
| Analytics | **PostHog** (cloud free tier or self-host on Hetzner if budget pinches) | Already used; product analytics + session recording. |
| Errors | **Sentry** | Already used. |
| Logs | **Better Stack** (~$9/mo) | Searchable; alerts. |
| CI | **GitHub Actions** | Already on. |

### One-line summary
**Next.js 15 + Supabase (Postgres + Auth + Realtime + Storage) + Inngest + Razorpay** — all on Vercel + Supabase + Cloudflare. ~$150/mo at 0–50k MAU.

## 3. Repo layout (v2)

```
kalakaarian/
├─ apps/
│  └─ web/                      # Next.js 15 app
│     ├─ app/                   # App Router
│     │  ├─ (marketing)/        # public pages: /, /privacy, /terms
│     │  ├─ (auth)/             # /login, /role-select
│     │  ├─ (app)/              # authenticated layout
│     │  │  ├─ marketplace/
│     │  │  ├─ campaigns/[id]/
│     │  │  ├─ proposals/[id]/
│     │  │  ├─ messages/
│     │  │  └─ dashboard/
│     │  └─ api/                # Route Handlers (webhooks)
│     │     ├─ razorpay/webhook/
│     │     └─ inngest/         # Inngest function host
│     ├─ components/
│     ├─ lib/
│     │  ├─ db/                 # Drizzle schema + queries
│     │  ├─ auth/               # Supabase client
│     │  ├─ inngest/            # Job definitions
│     │  └─ razorpay/
│     └─ next.config.ts (with next-pwa)
│
├─ packages/
│  ├─ db-schema/                # Drizzle schema, shared types
│  ├─ ui/                       # shadcn/ui kit
│  └─ config/                   # eslint, tsconfig, tailwind base
│
├─ supabase/
│  ├─ migrations/               # SQL migrations
│  ├─ seed.sql
│  └─ functions/                # Edge functions (only if needed)
│
└─ turbo.json                   # Turborepo
```

Tooling:
- **Turborepo** for task graph (build, lint, test) across apps + packages.
- **pnpm** for package management (faster, disk-friendly).
- **Biome** as linter+formatter (replaces ESLint+Prettier; 10× faster).

## 4. Database schema (Postgres, Drizzle)

```sql
-- users handled by Supabase Auth (auth.users); we mirror app-specific data
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('brand','influencer','admin')),
  email text unique not null,
  phone text unique,
  phone_verified boolean default false,
  name text not null,
  blocked boolean default false,
  token_version integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table influencer_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  bio text,
  city text,
  gender text check (gender in ('male','female','non_binary','prefer_not_to_say')),
  niches text[] default '{}',
  platforms text[] default '{}',
  tier text not null default 'nano' check (tier in ('nano','micro','mid','macro','mega')),
  pricing jsonb not null default '{}'::jsonb, -- {story:int, reel:int, video:int, post:int}
  social_handles jsonb not null default '{}'::jsonb, -- {instagram:'',youtube:''}
  portfolio jsonb default '[]'::jsonb,
  is_online boolean default false,
  last_seen_at timestamptz,
  verified boolean default false,
  search_tsv tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(bio,'')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(niches,' ')), 'B') ||
    setweight(to_tsvector('simple', coalesce(city,'')), 'C')
  ) stored
);
create index on influencer_profiles using gin(search_tsv);
create index on influencer_profiles (is_online desc, last_seen_at desc);
create index on influencer_profiles using gin(niches);
create index on influencer_profiles (tier, city);

create table brand_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  company_name text not null,
  industry text,
  website text,
  description text,
  contact_person text,
  social_media jsonb default '{}'::jsonb
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null,
  deliverables text not null,
  niches text[] default '{}',
  platforms text[] default '{}',
  budget_inr integer not null,
  deadline timestamptz not null,
  status text not null default 'draft'
    check (status in ('draft','open','in_progress','completed','cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on campaigns (status, deadline);
create index on campaigns (brand_id, status);

create table proposals (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  influencer_id uuid not null references profiles(id) on delete cascade,
  message text not null,
  bid_inr integer not null,
  timeline_days integer not null,
  status text not null default 'pending'
    check (status in ('pending','accepted','rejected','negotiating','withdrawn')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (campaign_id, influencer_id)
);
create index on proposals (influencer_id, status);
create index on proposals (campaign_id, status);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references profiles(id) on delete cascade,
  influencer_id uuid not null references profiles(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  last_message_at timestamptz default now(),
  unique (brand_id, influencer_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  attachments jsonb default '[]'::jsonb,
  read boolean default false,
  created_at timestamptz default now()
);
create index on messages (conversation_id, created_at);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tier text not null check (tier in ('regular','silver','gold')),
  start_date timestamptz not null,
  end_date timestamptz not null,
  auto_renew boolean default true,
  payment_ids text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);
create index on memberships (end_date);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('membership_payment','campaign_payment','payout','refund')),
  status text not null check (status in ('success','failed','pending','refunded')),
  amount_inr integer not null,
  payment_id text unique,
  provider_order_id text,
  description text,
  invoice_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index on transactions (user_id, created_at desc);

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles(id) on delete cascade,
  referred_id uuid references profiles(id) on delete cascade,
  code text unique not null,
  used_at timestamptz,
  reward_granted boolean default false,
  created_at timestamptz default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('user','message','campaign','proposal')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  resolved_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  type text default 'general' check (type in ('general','callback','business')),
  status text default 'new' check (status in ('new','reviewing','resolved')),
  created_at timestamptz default now()
);

create table audit_logs (
  id bigserial primary key,
  actor_id uuid references profiles(id),
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index on audit_logs (actor_id, created_at desc);
```

### Row-Level Security (RLS) examples
```sql
alter table profiles enable row level security;
create policy "users read own profile" on profiles
  for select using (auth.uid() = id);
create policy "users update own profile" on profiles
  for update using (auth.uid() = id);

alter table messages enable row level security;
create policy "participants read messages" on messages
  for select using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.brand_id = auth.uid() or c.influencer_id = auth.uid())
    )
  );
```

RLS replaces a lot of authorization-in-controller code.

## 5. Architecture diagram

```
                                ┌────────────────────────┐
                                │         User           │
                                │  (Android Chrome PWA)  │
                                └───────────┬────────────┘
                                            │ HTTPS
                                            ▼
                            ┌──────────────────────────────┐
                            │    Vercel Edge (Next.js 15)  │
                            │  - SSR / RSC for public pages│
                            │  - Server Actions for writes │
                            │  - Route Handlers (webhooks) │
                            └─────┬───────────────────┬────┘
              direct query (RLS)  │                   │ webhooks
                                  ▼                   ▼
                    ┌──────────────────────┐  ┌──────────────────┐
                    │   Supabase           │  │   Inngest        │
                    │  - Postgres 15       │  │   (jobs)         │
                    │  - Auth              │  │   - emails       │
                    │  - Realtime (chat)   │  │   - reminders    │
                    │  - Storage (assets)  │  │   - cron sweeps  │
                    └──────┬───────────────┘  └─────┬────────────┘
                           │ replication            │
                           ▼                        ▼
                    ┌──────────────┐        ┌──────────────┐
                    │  R2 Storage  │        │   Razorpay   │
                    │  (deliv.)    │        │              │
                    └──────────────┘        └──────────────┘
                           ▲
                           │
                    ┌──────┴───────┐
                    │   PostHog    │ (events)
                    │   Sentry     │ (errors)
                    │ Better Stack │ (logs)
                    └──────────────┘
```

## 6. API contracts (v2)

Mostly **server actions** invoked from React components. Webhook + 3rd-party-only routes are Route Handlers.

| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `/api/razorpay/webhook` | POST | none (HMAC) | Razorpay |
| `/api/inngest` | POST | Inngest signing | Jobs handler |
| `/api/health` | GET | none | Edge-runtime |
| `/api/cron/expire-memberships` | GET | Vercel Cron secret | Daily 03:00 IST |

Everything else is internal RPC via server actions / RPC pattern. Public REST is **not** exposed in v2 (consumed only by our own client). Reduces attack surface.

## 7. Realtime (chat + presence)

Supabase Realtime replaces poll-chat:
- Subscribe `messages` insert events scoped to `conversation_id`.
- Presence broadcast: `is_online`, `is_typing`.
- Server inserts row → Realtime pushes to all participants instantly. Eliminates polling cost.

## 8. Background jobs (Inngest)

| Job | Trigger | Action |
|---|---|---|
| `expire.memberships` | cron daily 03:00 | Demote users with `end_date < now`. Email reminder 7 days before expiry. |
| `send.invoice` | event `transaction.success` | Generate GST invoice PDF, upload to R2, email to user. |
| `referral.gold-reward.check` | event `membership.activated` (tier=gold) | Equivalent of v1 `checkAndGrantGoldReward`. |
| `proposal.reminder` | cron daily 11:00 | Email brands with proposals untouched > 3 days. |
| `presence.cleanup` | cron every 10 min | Mark stale `is_online` (last_seen_at > 5min) as offline. |
| `analytics.weekly-rollup` | cron Mon 09:00 | Compute KPI snapshots into `kpi_weekly` table for dashboards. |

## 9. Performance targets (v2)

| Metric | v1 (today) | v2 target |
|---|---|---|
| p95 API latency | unknown | < 200ms (median Supabase RTT 30–60ms in India) |
| Cold start | 5–10s | < 1s (Edge / Lambda warm) |
| TTFB (landing) | 1–2s | < 300ms (RSC + edge cache) |
| Lighthouse perf | unknown | ≥ 90 on slow-4G |
| Crash-free sessions | aim 99.5% | ≥ 99.8% |

## 10. Cost projection (50k MAU)

| Item | Tier | Cost/mo |
|---|---|---|
| Vercel Pro (Next.js) | Pro | $20 |
| Supabase Pro | Pro | $25 |
| Inngest Free | <50k steps | $0 (or $20 if exceeded) |
| Cloudflare R2 | ~50GB media | ~$0.75 + $0 egress |
| Sentry Team | Team | $26 |
| PostHog Cloud | up to 1M events | $0 (free tier) |
| Better Stack | basic | $9 |
| Resend | up to 50k emails/mo | $20 |
| Razorpay | 2% on txns | variable |
| Domain | | $0 (Vercel) |
| **Total fixed** | | **~$120–140/mo** |

## 11. Security model (v2)

- Auth managed by Supabase (proven, audited).
- RLS on every table — DB-enforced authorization.
- Service-role key used **only** in server actions / Inngest jobs (never shipped to client).
- HSTS + CSP via Next.js headers config.
- Rate limiting via Upstash Redis (per-user/per-IP) — necessary because Vercel functions don't share memory.
- Audit log on every admin action.
- Backups: Supabase point-in-time restore (7 days on Pro).

## 12. What's deliberately deferred to v3

- Multi-tenant agency accounts
- Native mobile app (Expo)
- AI-powered influencer matching
- Brand verification with KYC
- Influencer payouts via Razorpay Payouts API (still possible in v2 if needed)
- i18n (Hindi)

## 13. Decision log (lock these in pre-migration)

| Decision | Choice | Rationale |
|---|---|---|
| ORM | Drizzle | SQL-first, fast, types-from-schema |
| Linter | Biome | speed |
| Package mgr | pnpm | speed + disk |
| Monorepo | Turborepo | task graph |
| Auth | Supabase Auth | one provider, built-in |
| Realtime | Supabase Realtime | one provider |
| Jobs | Inngest | better DX than QStash for fan-out |
| Storage | Cloudflare R2 | India egress |
