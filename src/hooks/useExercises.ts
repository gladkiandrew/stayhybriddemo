import { useState, useEffect } from 'react';
import { supabase, Exercise } from '../lib/supabase';

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  async function fetchExercises() {
    setLoading(true);
    const { data, error } = await supabase
      .from('exercises')
      .select('*, coaches(*)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setExercises(data as Exercise[]);
    }
    setLoading(false);
  }

  return { exercises, loading, error, refetch: fetchExercises };
}
