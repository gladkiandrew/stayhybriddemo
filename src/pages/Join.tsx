import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BadgeCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type InviteStatus = 'loading' | 'valid' | 'invalid' | 'accepted';

export default function Join() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [inviteStatus, setInviteStatus] = useState<InviteStatus>('loading');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteId, setInviteId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setInviteStatus('invalid'); return; }
    validateToken();
  }, [token]);

  async function validateToken() {
    const { data } = await supabase
      .from('creator_invites')
      .select('id, email, accepted')
      .eq('token', token)
      .maybeSingle();

    if (!data) { setInviteStatus('invalid'); return; }
    if (data.accepted) { setInviteStatus('accepted'); return; }
    setInviteEmail(data.email);
    setEmail(data.email);
    setInviteId(data.id);
    setInviteStatus('valid');
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    const userId = authData.user?.id;
    if (!userId) { setError('Signup failed. Try again.'); setLoading(false); return; }

    await supabase.from('profiles').upsert({ id: userId, role: 'creator' });
    await supabase.from('creator_invites').update({ accepted: true }).eq('id', inviteId);

    navigate('/admin');
  }

  if (inviteStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (inviteStatus === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm p-8 flex flex-col items-center gap-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <AlertCircle size={36} style={{ color: '#FF3C00' }} />
          <h1 className="text-3xl" style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}>
            INVALID INVITE
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This invite link is invalid or has expired. Ask the admin for a new one.
          </p>
          <Link to="/" className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>Back to StayHybrid</Link>
        </div>
      </div>
    );
  }

  if (inviteStatus === 'accepted') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm p-8 flex flex-col items-center gap-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <BadgeCheck size={36} style={{ color: 'var(--accent)' }} />
          <h1 className="text-3xl" style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}>
            ALREADY ACCEPTED
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This invite has already been used. Sign in to access the creator dashboard.
          </p>
          <Link
            to="/login"
            className="px-6 py-2.5 text-lg transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: '#000', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
          >
            SIGN IN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <Link to="/" className="mb-10 flex items-center">
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: 'var(--text-primary)' }}>STAY</span>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: 'var(--accent)' }}>HYBRID</span>
      </Link>

      <div className="w-full max-w-sm p-8" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-5 p-3" style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.2)' }}>
          <BadgeCheck size={15} style={{ color: 'var(--accent)' }} />
          <div>
            <p className="text-xs" style={{ color: 'var(--accent)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
              CREATOR INVITE
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              You've been invited to upload exercises to StayHybrid
            </p>
          </div>
        </div>

        <h1 className="text-4xl mb-1" style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}>
          CREATE ACCOUNT
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Set a password for <span style={{ color: 'var(--text-primary)' }}>{inviteEmail}</span>
        </p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', opacity: 0.7 }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
              CONFIRM PASSWORD
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          {error && <p className="text-sm" style={{ color: '#FF3C00' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xl transition-opacity hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'var(--accent)', color: '#000', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> CREATING...</>
            ) : 'ACTIVATE CREATOR ACCESS'}
          </button>
        </form>
      </div>
    </div>
  );
}
