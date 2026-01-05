-- Add RLS policy to allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);
