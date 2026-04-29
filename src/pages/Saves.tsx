import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Exercise } from '../lib/supabase';
import { useSaves } from '../hooks/useSaves';
import DataBlock from '../components/DataBlock';
import DataBlockModal from '../components/DataBlockModal';
import { useToast } from '../components/Toast';

export default function Saves() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { savedIds, toggleSave } = useSaves();
  const { showToast } = useToast();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchSavedExercises();
  }, [user, savedIds.size]);

  async function fetchSavedExercises() {
    setLoading(true);
    const { data } = await supabase
      .from('saved_exercises')
      .select('exercise_id, exercises(*, coaches(*))')
      .eq('user_id', user!.id)
      .order('saved_at', { ascending: false });

    if (data) {
      setExercises(data.map((r: any) => r.exercises).filter(Boolean) as Exercise[]);
    }
    setLoading(false);
  }

  async function handleSave(exerciseId: string) {
    const nowSaved = await toggleSave(exerciseId);
    showToast(nowSaved ? 'Exercise saved' : 'Removed from library', nowSaved ? 'success' : 'info');
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-40" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.75rem', color: 'var(--text-primary)' }}>STAY</span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.75rem', color: 'var(--accent)' }}>HYBRID</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
              Database
            </Link>
            <button onClick={signOut} className="text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <p className="text-sm mb-2" style={{ color: 'var(--accent)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.2em' }}>
          YOUR LIBRARY
        </p>
        <div className="flex items-end gap-4">
          <h1
            className="leading-none"
            style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 6vw, 4rem)', letterSpacing: '0.02em' }}
          >
            SAVED EXERCISES
          </h1>
          {!loading && (
            <span className="text-xl mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif" }}>
              {exercises.length}
            </span>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse" style={{ background: 'var(--card)', border: '1px solid var(--border)', height: 380 }} />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <Bookmark size={48} style={{ color: 'var(--text-muted)' }} />
            <div className="text-center">
              <p className="text-3xl mb-2" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif" }}>
                NO SAVES YET
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Browse the database and start building your library
              </p>
              <Link
                to="/"
                className="px-6 py-3 text-lg transition-opacity hover:opacity-80"
                style={{ background: 'var(--accent)', color: '#000', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
              >
                BROWSE DATABASE
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises.map((ex) => (
              <DataBlock
                key={ex.id}
                exercise={ex}
                isSaved={savedIds.has(ex.id)}
                onSave={() => handleSave(ex.id)}
                onOpenLogin={() => {}}
                onOpenDetail={() => setSelectedExercise(ex)}
              />
            ))}
          </div>
        )}
      </main>

      {selectedExercise && (
        <DataBlockModal
          exercise={selectedExercise}
          isSaved={savedIds.has(selectedExercise.id)}
          onSave={() => handleSave(selectedExercise.id)}
          onOpenLogin={() => {}}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
}
