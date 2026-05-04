-- Agency notes per client (used by the Meta Ads tab and elsewhere).
-- Run this in your Supabase SQL editor.

create table if not exists agency_notes (
  id uuid primary key default gen_random_uuid(),
  client_slug text not null,         -- matches src/config/clients.js id
  context text not null default 'meta_video_ads',
  content text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text,
  unique (client_slug, context)
);

create index if not exists agency_notes_client_idx on agency_notes (client_slug);

alter table agency_notes enable row level security;

-- Admins (any authenticated profile with role admin/owner/account_manager) can read & write.
drop policy if exists agency_notes_admin_all on agency_notes;
create policy agency_notes_admin_all on agency_notes
  for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'owner', 'account_manager', 'team_member')
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'owner', 'account_manager', 'team_member')
    )
  );

-- Clients can read notes for their own client_slug only (read-only).
drop policy if exists agency_notes_client_read on agency_notes;
create policy agency_notes_client_read on agency_notes
  for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.client_slug = agency_notes.client_slug
    )
  );
