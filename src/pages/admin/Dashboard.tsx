import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, List, LogOut, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const { user, isCreator, loading, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });

  useEffect(() => {
    if (!loading && (!user || !isCreator)) navigate('/');
  }, [user, loading, isCreator, navigate]);

  useEffect(() => {
    if (isCreator) fetchStats();
  }, [isCreator]);

  async function fetchStats() {
    const { data } = await supabase.from('exercises').select('status');
    if (data) {
      setStats({
        total: data.length,
        published: data.filter((e) => e.status === 'published').length,
        drafts: data.filter((e) => e.status === 'draft').length,
      });
    }
  }

  if (loading || !user) return null;

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/upload', label: 'Upload Exercise', icon: Upload },
    { path: '/admin/exercises', label: 'Manage Exercises', icon: List },
    ...(role === 'admin' ? [{ path: '/admin/creators', label: 'Creators', icon: Users }] : []),
  ];

  const isOnRoot = location.pathname === '/admin';

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link to="/" className="flex items-center">
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: 'var(--text-primary)' }}>STAY</span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: 'var(--accent)' }}>HYBRID</span>
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="px-2 py-0.5 text-xs uppercase"
              style={{
                background: role === 'admin' ? 'rgba(200,255,0,0.12)' : 'rgba(0,212,255,0.12)',
                border: `1px solid ${role === 'admin' ? 'var(--accent)' : '#00D4FF'}`,
                color: role === 'admin' ? 'var(--accent)' : '#00D4FF',
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: '0.1em',
              }}
            >
              {role}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className="flex items-center gap-3 px-3 py-2.5 text-sm transition-all"
                style={{
                  background: active ? 'var(--card)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs mb-3 truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm w-full transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        {isOnRoot ? (
          <div className="p-8">
            <h1
              className="text-4xl mb-2"
              style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}
            >
              DASHBOARD
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'TOTAL EXERCISES', value: stats.total, color: 'var(--text-primary)' },
                { label: 'PUBLISHED', value: stats.published, color: 'var(--accent)' },
                { label: 'DRAFTS', value: stats.drafts, color: 'var(--text-secondary)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
                    {label}
                  </p>
                  <p className="text-5xl" style={{ color, fontFamily: "'Bebas Neue', sans-serif" }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Link
                to="/admin/upload"
                className="px-6 py-3 text-lg transition-opacity hover:opacity-80"
                style={{ background: 'var(--accent)', color: '#000', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
              >
                UPLOAD EXERCISE
              </Link>
              <Link
                to="/admin/exercises"
                className="px-6 py-3 text-lg transition-opacity hover:opacity-80"
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
              >
                MANAGE EXERCISES
              </Link>
              {role === 'admin' && (
                <Link
                  to="/admin/creators"
                  className="px-6 py-3 text-lg transition-opacity hover:opacity-80"
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
                >
                  MANAGE CREATORS
                </Link>
              )}
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
}
