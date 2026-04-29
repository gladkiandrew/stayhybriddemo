import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useExercises } from '../hooks/useExercises';
import { useSaves } from '../hooks/useSaves';
import FilterBar from '../components/FilterBar';
import DataBlock from '../components/DataBlock';
import DataBlockModal from '../components/DataBlockModal';
import LoginModal from '../components/LoginModal';
import { useToast } from '../components/Toast';
import { Exercise } from '../lib/supabase';

export default function Home() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);
  const { exercises, loading } = useExercises();
  const { savedIds, toggleSave } = useSaves();
  const { showToast } = useToast();

  const [activeCategory, setActiveCategory] = useState('All');
  const [activeMuscle, setActiveMuscle] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingSaveId, setPendingSaveId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesCategory = activeCategory === 'All' || ex.category?.includes(activeCategory);
      const matchesMuscle =
        activeMuscle === 'All' ||
        ex.muscle_group === activeMuscle ||
        ex.secondary_muscles?.includes(activeMuscle);
      const matchesSearch = !search || ex.title.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesMuscle && matchesSearch;
    });
  }, [exercises, activeCategory, activeMuscle, search]);

  async function handleSave(exerciseId: string) {
    const nowSaved = await toggleSave(exerciseId);
    showToast(nowSaved ? 'Exercise saved to your library' : 'Removed from your library', nowSaved ? 'success' : 'info');
  }

  function handleOpenLogin(exerciseId?: string) {
    if (exerciseId) setPendingSaveId(exerciseId);
    setShowLoginModal(true);
  }

  function handleLoginSuccess() {
    setShowLoginModal(false);
    if (pendingSaveId) {
      handleSave(pendingSaveId);
      setPendingSaveId(null);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.75rem', color: 'var(--text-primary)' }}>STAY</span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.75rem', color: 'var(--accent)' }}>HYBRID</span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              to="/creators"
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-secondary)' }}
            >
              Creators
            </Link>
            {user ? (
              <>
                <Link
                  to="/saves"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Bookmark size={14} />
                  My Saves
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/profile/${user.id}`}
                    className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold transition-all"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent)', flexShrink: 0 }}
                    title="View profile"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="profile" className="w-full h-full object-cover" />
                    ) : (
                      user.email?.[0].toUpperCase()
                    )}
                  </Link>
                  <button
                    onClick={signOut}
                    className="text-sm transition-opacity hover:opacity-70"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ background: 'var(--accent)', color: '#000' }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="py-10 px-4 sm:px-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto flex items-end justify-between">
          <div>
            <p
              className="text-sm mb-2"
              style={{ color: 'var(--accent)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.2em' }}
            >
              EXERCISE DATABASE
            </p>
            <h1
              className="leading-none"
              style={{
                color: 'var(--text-primary)',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(2.5rem, 7vw, 5rem)',
                letterSpacing: '0.02em',
              }}
            >
              TRAIN LIKE AN
              <br />
              <span style={{ color: 'var(--accent)' }}>ELITE ATHLETE</span>
            </h1>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {exercises.length} exercises
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        activeCategory={activeCategory}
        activeMuscle={activeMuscle}
        search={search}
        onCategoryChange={setActiveCategory}
        onMuscleChange={setActiveMuscle}
        onSearchChange={setSearch}
      />

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', height: 380 }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p
              className="text-3xl"
              style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif" }}
            >
              NO EXERCISES FOUND
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Try a different category or search term
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((ex, i) => (
              <DataBlock
                key={ex.id}
                exercise={ex}
                isSaved={savedIds.has(ex.id)}
                onSave={() => handleSave(ex.id)}
                onOpenLogin={() => handleOpenLogin(ex.id)}
                onOpenDetail={() => setSelectedExercise(ex)}
                onCategoryClick={(cat) => setActiveCategory(cat)}
                animationDelay={i * 50}
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
          onOpenLogin={() => setShowLoginModal(true)}
          onClose={() => setSelectedExercise(null)}
        />
      )}

      {showLoginModal && (
        <LoginModal
          onClose={() => { setShowLoginModal(false); setPendingSaveId(null); }}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
