-- Stores AI form-feedback notes from live camera sessions, surfaced in the Log tab.
create table if not exists camera_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise text not null,
  feedback jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists camera_sessions_user_id_created_at_idx
  on camera_sessions (user_id, created_at desc);

alter table camera_sessions enable row level security;

create policy "Users can insert their own camera sessions"
  on camera_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own camera sessions"
  on camera_sessions for select
  using (auth.uid() = user_id);
