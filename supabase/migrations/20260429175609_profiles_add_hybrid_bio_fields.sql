/*
  # Add hybrid_status (array), bio, and updated_at to profiles

  The profiles table already exists with a text 'sport' column.
  This migration:
  - Adds hybrid_statuses text[] for multi-select athletic identities
  - Adds bio text for profile description
  - Adds updated_at timestamptz
  - Leaves 'sport' in place (not breaking existing data)
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hybrid_statuses text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
