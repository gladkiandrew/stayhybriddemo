import { useState, useEffect } from 'react';
import { UserPlus, Copy, Check, Trash2, X, BadgeCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

type Invite = {
  id: string;
  email: string;
  token: string;
  accepted: boolean;
  created_at: string;
};

type Creator = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

export default function Creators() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [invites, setInvites] = useState<Invite[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [{ data: inviteData }, { data: creatorData }] = await Promise.all([
      supabase.from('creator_invites').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, role, full_name, created_at').in('role', ['creator', 'admin']),
    ]);

    if (inviteData) setInvites(inviteData as Invite[]);

    if (creatorData) {
      const rows: Creator[] = creatorData.map((p) => ({
        id: p.id,
        email: p.id === user?.id ? (user.email ?? p.id) : (p.full_name || `User ${p.id.slice(0, 8)}…`),
        role: p.role,
        created_at: p.created_at,
      }));
      setCreators(rows);
    }

    setLoading(false);
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);

    const { data, error } = await supabase
      .from('creator_invites')
      .insert({ email: email.trim().toLowerCase(), invited_by: user!.id })
      .select()
      .single();

    if (error) {
      showToast(error.message, 'error');
    } else {
      setInvites((p) => [data as Invite, ...p]);
      showToast('Invite created — copy the link below and send it', 'success');
      setEmail('');
    }
    setSending(false);
  }

  function getInviteLink(token: string) {
    return `${window.location.origin}/invite/${token}`;
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(getInviteLink(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  async function revokeInvite(id: string) {
    const { error } = await supabase.from('creator_invites').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    setInvites((p) => p.filter((i) => i.id !== id));
    setRevokeConfirm(null);
    showToast('Invite revoked', 'info');
  }

  async function removeCreator(id: string) {
    const { error } = await supabase.from('profiles').update({ role: 'user' }).eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    setCreators((p) => p.filter((c) => c.id !== id));
    setRevokeConfirm(null);
    showToast('Creator access removed', 'info');
  }

  const pendingInvites = invites.filter((i) => !i.accepted);
  const acceptedInvites = invites.filter((i) => i.accepted);

  return (
    <div className="p-8 max-w-3xl">
      <h1
        className="text-4xl mb-2"
        style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}
      >
        CREATOR ACCOUNTS
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Manage who can upload and edit exercises.
      </p>

      {/* Active creators */}
      <section className="mb-8">
        <SectionHeader label="ACTIVE CREATORS" count={creators.length} />

        {loading ? (
          <div className="py-4 text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
        ) : creators.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No creators yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {creators.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-4 py-3"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent)' }}
                  >
                    {c.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.email}</span>
                      <BadgeCheck size={14} style={{ color: 'var(--accent)' }} />
                    </div>
                    <span
                      className="text-xs uppercase"
                      style={{
                        color: c.role === 'admin' ? 'var(--accent)' : '#00D4FF',
                        fontFamily: "'Bebas Neue', sans-serif",
                        letterSpacing: '0.08em',
                      }}
                    >
                      {c.role}
                    </span>
                  </div>
                </div>

                {c.role !== 'admin' && (
                  <ConfirmAction
                    id={c.id}
                    confirmId={revokeConfirm}
                    setConfirmId={setRevokeConfirm}
                    label="Remove access?"
                    onConfirm={() => removeCreator(c.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Send invite */}
      <section className="mb-8">
        <SectionHeader label="INVITE A CREATOR" />
        <form onSubmit={sendInvite} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="creator@example.com"
            className="flex-1 px-4 py-3 text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
          />
          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="flex items-center gap-2 px-5 py-3 text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#000', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
          >
            <UserPlus size={14} />
            {sending ? 'CREATING...' : 'CREATE INVITE'}
          </button>
        </form>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          A shareable link will appear below. Send it to the creator — they sign up and get access instantly.
        </p>
      </section>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <section className="mb-8">
          <SectionHeader label="PENDING INVITES" count={pendingInvites.length} />
          <div className="flex flex-col gap-2">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex flex-col gap-3 px-4 py-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{inv.email}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Created {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ConfirmAction
                    id={inv.id}
                    confirmId={revokeConfirm}
                    setConfirmId={setRevokeConfirm}
                    label="Revoke?"
                    onConfirm={() => revokeInvite(inv.id)}
                  />
                </div>
                <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {getInviteLink(inv.token)}
                  </span>
                  <button
                    onClick={() => copyLink(inv.token)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs transition-all flex-shrink-0"
                    style={{
                      background: copied === inv.token ? 'rgba(200,255,0,0.1)' : 'transparent',
                      border: `1px solid ${copied === inv.token ? 'var(--accent)' : 'var(--border)'}`,
                      color: copied === inv.token ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {copied === inv.token ? <Check size={11} /> : <Copy size={11} />}
                    {copied === inv.token ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {acceptedInvites.length > 0 && (
        <section>
          <SectionHeader label="ACCEPTED INVITES" count={acceptedInvites.length} />
          <div className="flex flex-col gap-2">
            {acceptedInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{inv.email}</span>
                <span
                  className="text-xs px-2 py-0.5"
                  style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid var(--accent)', color: 'var(--accent)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
                >
                  ACCEPTED
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {count !== undefined && (
        <span
          className="w-6 h-6 flex items-center justify-center text-xs"
          style={{ background: 'var(--accent)', color: '#000', fontFamily: "'Bebas Neue', sans-serif" }}
        >
          {count}
        </span>
      )}
      <h2 className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.14em' }}>
        {label}
      </h2>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  );
}

function ConfirmAction({
  id, confirmId, setConfirmId, label, onConfirm,
}: {
  id: string;
  confirmId: string | null;
  setConfirmId: (v: string | null) => void;
  label: string;
  onConfirm: () => void;
}) {
  if (confirmId === id) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs mr-2" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <button onClick={onConfirm} className="p-1.5 hover:opacity-70" style={{ color: '#FF3C00' }}>
          <Check size={13} />
        </button>
        <button onClick={() => setConfirmId(null)} className="p-1.5 hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
          <X size={13} />
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={() => setConfirmId(id)}
      className="p-1.5 transition-opacity hover:opacity-70"
      style={{ color: 'var(--text-muted)' }}
    >
      <Trash2 size={13} />
    </button>
  );
}
