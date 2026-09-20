
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, display_name, emoji)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Nuevo'), '🏠');
  RETURN new;
END;
$$;
