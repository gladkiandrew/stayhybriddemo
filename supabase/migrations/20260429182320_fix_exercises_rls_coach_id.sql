/*
  # Fix exercises RLS to use coaches.user_id instead of auth.uid()

  exercises.coach_id references coaches.id (not auth.users).
  All write policies were incorrectly checking coach_id = auth.uid().
  The correct check is: the coaches row for that coach_id has user_id = auth.uid().
*/

DROP POLICY IF EXISTS "Creators can insert exercises" ON exercises;
DROP POLICY IF EXISTS "Creators can update own exercises" ON exercises;
DROP POLICY IF EXISTS "Creators can delete own exercises" ON exercises;
DROP POLICY IF EXISTS "Creators can read own exercises" ON exercises;

CREATE POLICY "Creators can read own exercises"
  ON exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = exercises.coach_id
      AND coaches.user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can insert exercises"
  ON exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = coach_id
      AND coaches.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('creator', 'admin')
    )
  );

CREATE POLICY "Creators can update own exercises"
  ON exercises FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = exercises.coach_id
      AND coaches.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = exercises.coach_id
      AND coaches.user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can delete own exercises"
  ON exercises FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = exercises.coach_id
      AND coaches.user_id = auth.uid()
    )
  );
