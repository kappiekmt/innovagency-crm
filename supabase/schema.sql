-- Innovagency Admin Schema
-- Run this in your Supabase SQL editor

-- Clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  status text default 'active', -- active | paused
  cpa_target numeric,
  roas_target numeric,
  created_at timestamptz default now()
);

-- Weekly Stats
create table if not exists weekly_stats (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  meta_spend numeric default 0,
  meta_conversions integer default 0,
  google_spend numeric default 0,
  google_conversions integer default 0,
  organic_conversions integer default 0,
  notes text,
  created_at timestamptz default now(),
  unique(client_id, week_start)
);

-- Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  description text,
  status text default 'todo', -- todo | in_progress | review | done
  priority text default 'medium', -- low | medium | high
  assignee text,
  due_date date,
  created_at timestamptz default now()
);

-- Activity Log
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  action text not null,
  detail text,
  created_at timestamptz default now()
);

-- Agency Settings
create table if not exists agency_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  created_at timestamptz default now()
);

-- Seed demo data
insert into clients (name, slug, status, cpa_target, roas_target) values
  ('Zitcomfort', 'zitcomfort', 'active', 45.00, 3.5),
  ('Landgoed Bourtange', 'landgoed-bourtange', 'active', 80.00, 2.8),
  ('Bloem & Co', 'bloem-co', 'active', 30.00, 4.0)
on conflict (slug) do nothing;

-- Seed 8 weeks of demo data (run after clients are inserted)
-- This is a template; adjust client_ids after inserting clients
