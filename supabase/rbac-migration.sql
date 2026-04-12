-- ============================================================
-- RBAC Migration — Innovagency CRM
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Team assignments (internal user ↔ client, many-to-many)
CREATE TABLE IF NOT EXISTS team_assignments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by  uuid REFERENCES auth.users(id),
  assigned_at  timestamptz DEFAULT now(),
  UNIQUE(client_id, user_id)
);

CREATE INDEX IF NOT EXISTS team_assignments_client ON team_assignments(client_id);
CREATE INDEX IF NOT EXISTS team_assignments_user   ON team_assignments(user_id);

-- 2. Migrate existing 'admin' profiles to 'account_manager'
UPDATE profiles SET role = 'account_manager' WHERE role = 'admin';

-- 3. Enable RLS on all tables
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_stats     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES policies
-- ============================================================

-- Internal users can read all profiles
CREATE POLICY "internal_read_profiles" ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'account_manager', 'team_member', 'viewer')
    )
  );

-- Users can read their own profile (needed for auth bootstrap)
CREATE POLICY "own_profile_read" ON profiles FOR SELECT
  USING (id = auth.uid());

-- Only owner can insert/update profiles
CREATE POLICY "owner_manage_profiles" ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
  );

-- ============================================================
-- CLIENTS policies
-- ============================================================

-- Owner/account_manager/team_member/viewer: see all clients
CREATE POLICY "internal_read_clients" ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'account_manager', 'team_member', 'viewer')
    )
  );

-- Owner can insert/update/delete clients
CREATE POLICY "owner_manage_clients" ON clients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
  );

-- Client users can only see their own client
CREATE POLICY "client_read_own" ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('client', 'client_admin', 'client_member')
        AND p.client_id = clients.id
    )
  );

-- ============================================================
-- TASKS policies
-- ============================================================

-- Internal: all tasks visible
CREATE POLICY "internal_read_tasks" ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'account_manager', 'team_member', 'viewer')
    )
  );

-- Owner/account_manager: full task management
CREATE POLICY "manager_manage_tasks" ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'account_manager')
    )
  );

-- Team member: manage only their own tasks
CREATE POLICY "team_member_own_tasks" ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'team_member'
        AND tasks.assignee = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Client users: see tasks for their client only
CREATE POLICY "client_read_own_tasks" ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('client', 'client_admin', 'client_member')
        AND p.client_id = tasks.client_id
    )
  );

-- ============================================================
-- WEEKLY STATS policies
-- ============================================================

CREATE POLICY "internal_read_stats" ON weekly_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'account_manager', 'team_member', 'viewer')
    )
  );

CREATE POLICY "owner_manage_stats" ON weekly_stats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
  );

CREATE POLICY "client_read_own_stats" ON weekly_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('client', 'client_admin', 'client_member')
        AND p.client_id = weekly_stats.client_id
    )
  );

-- ============================================================
-- ACTIVITY LOG policies
-- ============================================================

CREATE POLICY "internal_read_activity" ON activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'account_manager', 'team_member', 'viewer')
    )
  );

CREATE POLICY "owner_manage_activity" ON activity_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('owner', 'account_manager')
    )
  );

CREATE POLICY "client_read_own_activity" ON activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('client', 'client_admin', 'client_member')
        AND p.client_id = activity_log.client_id
    )
  );

-- ============================================================
-- AGENCY SETTINGS policies
-- ============================================================

CREATE POLICY "internal_read_settings" ON agency_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'account_manager', 'team_member', 'viewer')
    )
  );

CREATE POLICY "owner_manage_settings" ON agency_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
  );

-- ============================================================
-- TEAM ASSIGNMENTS policies
-- ============================================================

CREATE POLICY "internal_read_assignments" ON team_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'account_manager', 'team_member', 'viewer')
    )
  );

CREATE POLICY "owner_manage_assignments" ON team_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('owner', 'account_manager')
    )
  );

-- ============================================================
-- Done. Verify with:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- ============================================================
