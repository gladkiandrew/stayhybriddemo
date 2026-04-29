import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useSaves() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    fetchSaves();
  }, [user]);

  async function fetchSaves() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('saved_exercises')
      .select('exercise_id')
      .eq('user_id', user.id);
    if (data) {
      setSavedIds(new Set(data.map((s) => s.exercise_id)));
    }
    setLoading(false);
  }

  async function toggleSave(exerciseId: string): Promise<boolean> {
    if (!user) return false;

    if (savedIds.has(exerciseId)) {
      await supabase
        .from('saved_exercises')
        .delete()
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(exerciseId);
        return next;
      });
      return false;
    } else {
      await supabase
        .from('saved_exercises')
        .insert({ user_id: user.id, exercise_id: exerciseId });
      setSavedIds((prev) => new Set(prev).add(exerciseId));
      return true;
    }
  }

  return { savedIds, loading, toggleSave, refetch: fetchSaves };
}
