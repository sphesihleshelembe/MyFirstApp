/*
  # Add automatic profile creation trigger

  1. Purpose
    - Automatically create a profile record when a new user signs up
    - Extract full_name from user metadata and store it in the profile
    - Ensure profile is created with the user's ID

  2. Changes
    - Create a function `handle_new_user()` that inserts a profile record
    - Create a trigger `on_auth_user_created` that fires after INSERT on `auth.users`
    - The function extracts `full_name` from `raw_user_meta_data` if available

  3. Security
    - The function runs with security definer privileges
    - Only triggered by Supabase Auth system after user creation
*/

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    '',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to call the function after a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Comment on the function for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile record when a new user signs up';
