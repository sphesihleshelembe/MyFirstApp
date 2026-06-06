CREATE TABLE IF NOT EXISTS favorite_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, template_id)
);

ALTER TABLE favorite_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_favorites" ON favorite_templates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_favorites" ON favorite_templates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_favorites" ON favorite_templates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
