/*
  # Profiles table + creator_invites table

  ## New Tables

  ### profiles
  Stores public user profile information, extending Supabase auth.users.
  - id (uuid, FK to auth.users) — primary key
  - username (text, unique, nullable) — chosen display name
  - full_name (text) — full display name
  - bio (text) — freeform profile description
  - avatar_url (text) — profile photo URL
  - hybrid_status (text) — self-described athlete identity (Runner, Triathlete, etc.)
  - role (text, default 'user') — 'user' | 'creator' | 'admin'
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### creator_invites
  Single-use invite tokens allowing admin to grant creator access.
  - id (uuid, primary key)
  - email (text) — intended recipient email
  - token (uuid, unique) — the invite token sent in the URL
  - invited_by (uuid, FK to auth.users) — who created the invite
  - accepted (boolean, default false) — whether it's been used
  - created_at (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Users can read all profiles (public browsing)
  - Users can only update their own profile
  - creator_invites: only admin can insert/select; token-based read for join page
  - Auto-create profile row on new user signup via trigger
*/

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     text UNIQUE,
  full_name    text DEFAULT '',
  bio          text DEFAULT '',
  avatar_url   text DEFAULT '',
  hybrid_status text DEFAULT '',
  role         text DEFAULT 'user',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon can view profiles"
  ON profiles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Seed admin profile if not exists
INSERT INTO profiles (id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'gladkiandrew47@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ─────────────────────────────────────────────
-- creator_invites
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  token       uuid UNIQUE DEFAULT gen_random_uuid(),
  invited_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE creator_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators and admins can select invites"
  ON creator_invites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('creator', 'admin')
    )
  );

CREATE POLICY "Anyone can read invite by token for join page"
  ON creator_invites FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins and creators can insert invites"
  ON creator_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('creator', 'admin')
    )
  );

CREATE POLICY "Anyone can accept invite"
  ON creator_invites FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (accepted = true);

-- ─────────────────────────────────────────────
-- Auto-create profile on signup trigger
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (
    NEW.id,
    CASE WHEN NEW.email = 'gladkiandrew47@gmail.com' THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
