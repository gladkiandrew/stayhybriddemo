import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, ArrowRight } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function CreatorsBrowse() {
  const { user } = useAuth();
  const [creators, setCreators] = useState<(Profile & { exercise_count: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCreators(); }, []);

  async function fetchCreators() {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['creator', 'admin'])
      .order('created_at', { ascending: true });

    if (!profileData) { setLoading(false); return; }

    // Get exercise counts per creator
    const ids = profileData.map((p) => p.id);
    const { data: exerciseData } = await supabase
      .from('exercises')
      .select('coach_id')
      .in('coach_id', ids)
      .eq('status', 'published');

    const counts: Record<string, number> = {};
    exerciseData?.forEach((e) => { counts[e.coach_id] = (counts[e.coach_id] ?? 0) + 1; });

    setCreators(profileData.map((p) => ({ ...(p as Profile), exercise_count: counts[p.id] ?? 0 })));
    setLoading(false);
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.75rem', color: 'var(--text-primary)' }}>STAY</span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.75rem', color: 'var(--accent)' }}>HYBRID</span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link to="/" className="text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
              Exercises
            </Link>
            <Link
              to="/creators"
              className="text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: 'var(--accent)' }}
            >
              Creators
            </Link>
            {user ? (
              <Link
                to={`/profile/${user.id}`}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:border-accent"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent)' }}
              >
                {user.email?.[0].toUpperCase()}
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--accent)', color: '#000' }}
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="py-10 px-4 sm:px-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto">
          <p
            className="text-sm mb-2"
            style={{ color: 'var(--accent)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.2em' }}
          >
            CREATORS
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
            LEARN FROM THE
            <br />
            <span style={{ color: 'var(--accent)' }}>BEST ATHLETES</span>
          </h1>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse" style={{ background: 'var(--card)', border: '1px solid var(--border)', height: 220 }} />
            ))}
          </div>
        ) : creators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-3xl" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif" }}>
              NO CREATORS YET
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator, i) => {
              const displayName = creator.full_name || `Athlete ${creator.id.slice(0, 6)}`;
              const initials = displayName.slice(0, 2).toUpperCase();
              return (
                <Link
                  key={creator.id}
                  to={`/profile/${creator.id}`}
                  className="group flex flex-col"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
                    animation: `fadeUp 0.4s ease-out ${i * 60}ms both`,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = '#444';
                    el.style.transform = 'translateY(-2px)';
                    el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = 'var(--border)';
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = 'none';
                  }}
                >
                  {/* Top accent bar */}
                  <div
                    className="h-1 w-full"
                    style={{ background: creator.role === 'admin' ? 'var(--accent)' : '#00D4FF' }}
                  />

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold flex-shrink-0"
                        style={{ background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--accent)' }}
                      >
                        {creator.avatar_url ? (
                          <img src={creator.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                        ) : initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className="leading-tight truncate"
                            style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', letterSpacing: '0.02em' }}
                          >
                            {displayName}
                          </h3>
                          <BadgeCheck size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        </div>
                        {creator.hybrid_statuses?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {creator.hybrid_statuses.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="inline-block text-xs px-2 py-0.5"
                                style={{
                                  background: 'rgba(200,255,0,0.08)',
                                  border: '1px solid rgba(200,255,0,0.2)',
                                  color: 'var(--accent)',
                                  fontFamily: "'Bebas Neue', sans-serif",
                                  letterSpacing: '0.08em',
                                }}
                              >
                                {s.toUpperCase()}
                              </span>
                            ))}
                            {creator.hybrid_statuses.length > 3 && (
                              <span className="text-xs px-2 py-0.5" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                +{creator.hybrid_statuses.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {creator.bio && (
                      <p
                        className="text-sm flex-1 mb-4"
                        style={{
                          color: 'var(--text-secondary)',
                          lineHeight: '1.65',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {creator.bio}
                      </p>
                    )}

                    <div
                      className="flex items-center justify-between pt-4 mt-auto"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem' }}>
                          {creator.exercise_count}
                        </span>
                        {' '}exercises
                      </span>
                      <span
                        className="flex items-center gap-1 text-sm transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        View profile
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
