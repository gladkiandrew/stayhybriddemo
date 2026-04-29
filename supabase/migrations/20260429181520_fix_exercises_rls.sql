/*
  # Fix exercises RLS policies

  The existing ALL policy had no WITH CHECK clause, causing INSERT to fail.
  Replace it with proper per-operation policies that allow creators and admins
  to manage their own exercises, while keeping public read for published ones.
*/

DROP POLICY IF EXISTS "exercises_admin_write" ON exercises;
DROP POLICY IF EXISTS "exercises_public_read" ON exercises;

-- Anyone can read published exercises
CREATE POLICY "Public can read published exercises"
  ON exercises FOR SELECT
  USING (status = 'published');

-- Creators and admins can read all their own exercises (including drafts)
CREATE POLICY "Creators can read own exercises"
  ON exercises FOR SELECT
  TO authenticated
  USING (
    coach_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('creator', 'admin')
      AND exercises.coach_id = auth.uid()
    )
  );

-- Creators and admins can insert exercises (must be their own)
CREATE POLICY "Creators can insert exercises"
  ON exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('creator', 'admin')
    )
  );

-- Creators and admins can update their own exercises
CREATE POLICY "Creators can update own exercises"
  ON exercises FOR UPDATE
  TO authenticated
  USING (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('creator', 'admin')
    )
  )
  WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('creator', 'admin')
    )
  );

-- Creators and admins can delete their own exercises
CREATE POLICY "Creators can delete own exercises"
  ON exercises FOR DELETE
  TO authenticated
  USING (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('creator', 'admin')
    )
  );
