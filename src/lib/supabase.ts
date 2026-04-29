import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string | null;
  full_name: string;
  bio: string;
  avatar_url: string;
  hybrid_statuses: string[];
  role: 'user' | 'creator' | 'admin';
  created_at: string;
  updated_at: string;
};

export type Coach = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatar_url: string;
  instagram_url: string;
  verified: boolean;
  created_at: string;
};

export type Exercise = {
  id: string;
  coach_id: string;
  title: string;
  category: string[];
  muscle_group: string;
  secondary_muscles: string[];
  short_video_url: string;
  tutorial_video_url: string;
  benefits: string;
  status: 'draft' | 'published';
  created_at: string;
  sets_reps: string;
  rest_period: string;
  coaching_cues: string;
  common_mistakes: string;
  difficulty: string;
  visibility: 'free' | 'pro' | 'elite';
  featured: boolean;
  equipment: string[];
  view_count: number;
  save_count: number;
  coaches?: Coach;
};
