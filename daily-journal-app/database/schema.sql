-- Daily Journal App (Daybook)
-- Run this file in the Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  title varchar(120),
  content text not null check (char_length(btrim(content)) between 1 and 12000),
  mood text not null default 'Calm'
    check (mood in ('Calm', 'Happy', 'Grateful', 'Anxious', 'Tired')),
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_entries_one_per_day unique (entry_date)
);

create index if not exists journal_entries_date_idx
  on public.journal_entries (entry_date desc);
create index if not exists journal_entries_mood_idx
  on public.journal_entries (mood);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists journal_entries_set_updated_at on public.journal_entries;
create trigger journal_entries_set_updated_at
before update on public.journal_entries
for each row execute function public.set_updated_at();

-- This beginner MVP accesses the database only through its Express server.
-- Keep RLS enabled to block direct access via browser/public keys.
-- The server's service-role key bypasses RLS, so backend routes must remain
-- the only route to this table and must never be exposed to the browser.
alter table public.journal_entries enable row level security;
