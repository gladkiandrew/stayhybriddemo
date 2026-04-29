import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

type Props = {
  onClose: () => void;
  onSuccess?: () => void;
};

export default function LoginModal({ onClose, onSuccess }: Props) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      showToast('Signed in successfully', 'success');
      onSuccess?.();
      onClose();
    }
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm p-8 relative"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 transition-opacity hover:opacity-60"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>

        <h2
          className="text-3xl mb-1"
          style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}
        >
          SIGN IN
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Save exercises and build your library
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          {error && <p className="text-sm" style={{ color: 'var(--accent-red)' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-lg transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#000', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        <p className="text-sm mt-4 text-center" style={{ color: 'var(--text-secondary)' }}>
          No account?{' '}
          <a href="/signup" className="hover:underline" style={{ color: 'var(--accent)' }}>
            Sign up free
          </a>
        </p>
      </div>
    </div>
  );
}
