-- scripts/init_rls.sql
-- Runs automatically when PostgreSQL container first starts
-- Sets up Row Level Security so Company A can NEVER see Company B's data

-- Enable RLS on all tenant tables (called after Alembic creates them)
-- This script is idempotent - safe to run multiple times

-- Create a function to get current tenant from session variable
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;