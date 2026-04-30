import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

type PageState = 'loading' | 'valid' | 'invalid' | 'already_accepted';

type InviteRow = {
  id: string;
  email: string;
  accepted: boolean;
};

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invite, setInvite] = useState<InviteRow | null>(null);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setPageState('invalid'); return; }
    (async () => {
      const { data, error } = await supabase
        .from('creator_invites')
        .select('id, email, accepted')
        .eq('token', token)
        .maybeSingle();

      if (error || !data) { setPageState('invalid'); return; }
      if (data.accepted) { setPageState('already_accepted'); return; }
      setInvite(data);
      setPageState('valid');
    })();
  }, [token]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  function clearFieldError(key: string) {
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !invite) return;

    setSubmitting(true);
    setSubmitError('');

    // 1. Create the auth account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError || !signUpData.user) {
      setSubmitError(signUpError?.message ?? 'Signup failed. Please try again.');
      setSubmitting(false);
      return;
    }

    const uid = signUpData.user.id;

    // 2. Set full_name on profile (trigger creates it, we just update the name)
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', uid);

    // 3. Accept invite — promotes role to 'creator' atomically via SECURITY DEFINER fn
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('accept_creator_invite', { p_token: token });

    if (rpcError || rpcResult !== 'ok') {
      setSubmitError('Account created but invite acceptance failed. Contact support.');
      setSubmitting(false);
      return;
    }

    // 4. Insert coaches row (now allowed since role = 'creator')
    const handle = fullName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    await supabase.from('coaches').insert({
      name: fullName.trim(),
      handle,
      user_id: uid,
      verified: false,
    });

    showToast('Welcome to StayHybrid! Start uploading your exercises.', 'success');
    navigate('/admin/upload');
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#0A0A0A', fontFamily: "'DM Sans', sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <Zap size={20} color="#C8FF00" fill="#C8FF00" />
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, color: '#fff' }}>STAY</span>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, color: '#C8FF00' }}>HYBRID</span>
      </div>

      {pageState === 'loading' && (
        <div className="flex items-center gap-3" style={{ color: '#444' }}>
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#C8FF00', borderTopColor: 'transparent' }} />
          <span className="text-sm">Verifying invite...</span>
        </div>
      )}

      {pageState === 'invalid' && (
        <div
          className="w-full max-w-sm p-8 text-center flex flex-col gap-4"
          style={{ background: '#111', border: '1px solid rgba(255,60,0,0.3)' }}
        >
          <div
            className="w-12 h-12 mx-auto flex items-center justify-center"
            style={{ background: 'rgba(255,60,0,0.08)', border: '1px solid rgba(255,60,0,0.3)' }}
          >
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#FF3C00' }}>!</span>
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', letterSpacing: '0.04em', color: '#fff' }}>
            INVITE NOT FOUND
          </h2>
          <p className="text-sm" style={{ color: '#888', lineHeight: 1.65 }}>
            This invite link is invalid or has already been used. Ask your admin to send a new one.
          </p>
        </div>
      )}

      {pageState === 'already_accepted' && (
        <div
          className="w-full max-w-sm p-8 text-center flex flex-col gap-4"
          style={{ background: '#111', border: '1px solid rgba(200,255,0,0.2)' }}
        >
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', letterSpacing: '0.04em', color: '#fff' }}>
            ALREADY ACCEPTED
          </h2>
          <p className="text-sm" style={{ color: '#888', lineHeight: 1.65 }}>
            This invite has already been used. Log in to access your creator account.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-2 px-6 py-3 text-lg transition-opacity hover:opacity-80"
            style={{ background: '#C8FF00', color: '#000', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
          >
            GO TO LOGIN
          </button>
        </div>
      )}

      {pageState === 'valid' && invite && (
        <div className="w-full max-w-md" style={{ background: '#111', border: '1px solid #222' }}>
          <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid #1a1a1a' }}>
            <h1
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '0.04em', color: '#fff', marginBottom: 6 }}
            >
              YOU'VE BEEN INVITED
            </h1>
            <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: 1.6 }}>
              You've been invited to become a creator on StayHybrid. Complete your signup below to start uploading exercises.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-7 flex flex-col gap-5">
            {/* Email — read-only */}
            <div>
              <label style={labelStyle}>EMAIL</label>
              <div style={{ ...inputBase, color: '#666', cursor: 'default' }}>
                {invite.email}
              </div>
            </div>

            {/* Full name */}
            <div>
              <label style={labelStyle}>
                FULL NAME <span style={{ color: '#FF3C00' }}>*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); clearFieldError('fullName'); }}
                placeholder="Your full name"
                style={{ ...inputBase, color: '#fff', border: `1px solid ${fieldErrors.fullName ? '#FF3C00' : '#222'}`, outline: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = '#C8FF00'; }}
                onBlur={(e) => { e.target.style.borderColor = fieldErrors.fullName ? '#FF3C00' : '#222'; }}
              />
              {fieldErrors.fullName && <p style={errorStyle}>{fieldErrors.fullName}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>
                PASSWORD <span style={{ color: '#FF3C00' }}>*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                placeholder="Min. 8 characters"
                style={{ ...inputBase, color: '#fff', border: `1px solid ${fieldErrors.password ? '#FF3C00' : '#222'}`, outline: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = '#C8FF00'; }}
                onBlur={(e) => { e.target.style.borderColor = fieldErrors.password ? '#FF3C00' : '#222'; }}
              />
              {fieldErrors.password && <p style={errorStyle}>{fieldErrors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label style={labelStyle}>
                CONFIRM PASSWORD <span style={{ color: '#FF3C00' }}>*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
                placeholder="Repeat your password"
                style={{ ...inputBase, color: '#fff', border: `1px solid ${fieldErrors.confirmPassword ? '#FF3C00' : '#222'}`, outline: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = '#C8FF00'; }}
                onBlur={(e) => { e.target.style.borderColor = fieldErrors.confirmPassword ? '#FF3C00' : '#222'; }}
              />
              {fieldErrors.confirmPassword && <p style={errorStyle}>{fieldErrors.confirmPassword}</p>}
            </div>

            {submitError && (
              <div style={{ background: 'rgba(255,60,0,0.08)', border: '1px solid rgba(255,60,0,0.3)', padding: '12px 16px' }}>
                <p style={{ color: '#FF3C00', fontSize: '0.85rem' }}>{submitError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{
                background: '#C8FF00',
                color: '#000',
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: '0.08em',
                fontSize: '1.2rem',
                padding: '14px',
                marginTop: 4,
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#000', borderTopColor: 'transparent' }} />
                  CREATING ACCOUNT...
                </>
              ) : (
                'CREATE ACCOUNT & JOIN STAYHYBRID'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  marginBottom: 8,
  color: '#444',
  fontFamily: "'Bebas Neue', sans-serif",
  letterSpacing: '0.12em',
};

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  fontSize: '0.875rem',
  background: '#161616',
  border: '1px solid #222',
  boxSizing: 'border-box',
};

const errorStyle: React.CSSProperties = {
  color: '#FF3C00',
  fontSize: '0.75rem',
  marginTop: 4,
};
