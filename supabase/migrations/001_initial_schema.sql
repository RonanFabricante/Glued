-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create connection_status enum
CREATE TYPE connection_status AS ENUM ('active', 'met', 'closed', 'timed_out');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  area TEXT,
  intent_types TEXT[] DEFAULT '{}',
  availability JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create connections table
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status connection_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '14 days',
  resolved_at TIMESTAMPTZ,
  CONSTRAINT different_users CHECK (user_a != user_b)
);

-- Create index for faster queries
CREATE INDEX idx_connections_user_a_status ON connections(user_a, status);
CREATE INDEX idx_connections_user_b_status ON connections(user_b, status);
CREATE INDEX idx_connections_expires_at ON connections(expires_at) WHERE status = 'active';

-- Function to count active connections for a user
CREATE OR REPLACE FUNCTION count_active_connections(user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM connections
  WHERE (user_a = user_id OR user_b = user_id)
    AND status = 'active';
$$ LANGUAGE SQL STABLE;

-- Function to enforce max 3 active connections
CREATE OR REPLACE FUNCTION enforce_max_three_active()
RETURNS TRIGGER AS $$
DECLARE
  user_a_count INTEGER;
  user_b_count INTEGER;
BEGIN
  -- Only check if the connection is active
  IF NEW.status = 'active' THEN
    -- Count active connections for user_a
    SELECT count_active_connections(NEW.user_a) INTO user_a_count;
    
    -- Count active connections for user_b
    SELECT count_active_connections(NEW.user_b) INTO user_b_count;
    
    -- Check if either user already has 3 or more active connections
    IF user_a_count >= 3 THEN
      RAISE EXCEPTION 'User A already has 3 active connections';
    END IF;
    
    IF user_b_count >= 3 THEN
      RAISE EXCEPTION 'User B already has 3 active connections';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce max connections
CREATE TRIGGER trigger_enforce_max_three_active
  BEFORE INSERT OR UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION enforce_max_three_active();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for connections
-- Users can view connections they are part of
CREATE POLICY "Users can view own connections"
  ON connections FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Users can insert connections where they are user_a
CREATE POLICY "Users can create connections as user_a"
  ON connections FOR INSERT
  WITH CHECK (auth.uid() = user_a);

-- Users can update connections they are part of
CREATE POLICY "Users can update own connections"
  ON connections FOR UPDATE
  USING (auth.uid() = user_a OR auth.uid() = user_b)
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

-- No delete policy (deletes disallowed from clients)

-- Function to get other user in a connection
CREATE OR REPLACE FUNCTION get_connection_other_user(connection_id UUID, current_user_id UUID)
RETURNS UUID AS $$
  SELECT CASE
    WHEN user_a = current_user_id THEN user_b
    WHEN user_b = current_user_id THEN user_a
    ELSE NULL
  END
  FROM connections
  WHERE id = connection_id;
$$ LANGUAGE SQL STABLE;
