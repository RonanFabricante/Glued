-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_messages_connection_id ON messages(connection_id, created_at);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view messages in their connections
CREATE POLICY "Users can view messages in their connections"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM connections
      WHERE connections.id = messages.connection_id
      AND (connections.user_a = auth.uid() OR connections.user_b = auth.uid())
    )
  );

-- RLS Policy: Users can send messages in their active connections
CREATE POLICY "Users can send messages in their connections"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM connections
      WHERE connections.id = messages.connection_id
      AND (connections.user_a = auth.uid() OR connections.user_b = auth.uid())
      AND connections.status = 'active'
    )
  );

-- RLS Policy: Users can update read_at for messages they received
CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM connections
      WHERE connections.id = messages.connection_id
      AND (connections.user_a = auth.uid() OR connections.user_b = auth.uid())
      AND messages.sender_id != auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM connections
      WHERE connections.id = messages.connection_id
      AND (connections.user_a = auth.uid() OR connections.user_b = auth.uid())
      AND messages.sender_id != auth.uid()
    )
  );

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
