-- App ratings table: stores post-payment user feedback on the platform
create table if not exists app_ratings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete set null,
  score         integer not null check (score >= 1 and score <= 5),
  feedback      text check (char_length(feedback) <= 500),
  created_at    timestamptz not null default now()
);

-- Index for aggregate queries
create index if not exists app_ratings_score_idx on app_ratings (score);
create index if not exists app_ratings_user_idx on app_ratings (user_id);
