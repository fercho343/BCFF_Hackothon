CREATE POLICY "Users can create own avatar state" ON avatar_states FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
