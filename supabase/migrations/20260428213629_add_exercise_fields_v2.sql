/*
  # Exercises table — Phase 2 field additions

  Adds richer metadata columns needed for the upgraded creator upload form
  and the public DataBlock display.

  ## New Columns
  - sets_reps (text) — e.g. "4x6", "3x8-12", "AMRAP"
  - rest_period (text) — e.g. "90 seconds"
  - coaching_cues (text) — key form points for the exercise
  - common_mistakes (text) — what to avoid
  - difficulty (text, default 'Intermediate') — Beginner | Intermediate | Advanced | Elite
  - visibility (text, default 'free') — free | pro | elite tier gating
  - featured (boolean, default false) — pinned to homepage
  - mit_approved (boolean, default false) — coach approval flag
  - equipment (text[], default '{}') — equipment tags
  - view_count (integer, default 0)
  - save_count (integer, default 0)
*/

alter table exercises add column if not exists sets_reps text;
alter table exercises add column if not exists rest_period text;
alter table exercises add column if not exists coaching_cues text;
alter table exercises add column if not exists common_mistakes text;
alter table exercises add column if not exists difficulty text default 'Intermediate';
alter table exercises add column if not exists visibility text default 'free';
alter table exercises add column if not exists featured boolean default false;
alter table exercises add column if not exists mit_approved boolean default false;
alter table exercises add column if not exists equipment text[] default '{}';
alter table exercises add column if not exists view_count integer default 0;
alter table exercises add column if not exists save_count integer default 0;
