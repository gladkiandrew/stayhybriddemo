import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, CreditCard as Edit2, Check, X, Camera, ArrowLeft } from 'lucide-react';
import { supabase, Profile, Exercise } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSaves } from '../hooks/useSaves';
import { useToast } from '../components/Toast';
import DataBlock from '../components/DataBlock';
import DataBlockModal from '../components/DataBlockModal';
import LoginModal from '../components/LoginModal';

const HYBRID_STATUSES = [
  'Runner', 'Bodybuilder', 'Swimmer', 'Triathlete', 'Football Player',
  'Basketball Player', 'Cyclist', 'CrossFitter', 'Powerlifter', 'Martial Artist',
  'Gymnast', 'Rower', 'Soccer Player', 'Tennis Player', 'Hybrid Athlete',
];

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savedIds, toggleSave } = useSaves();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    avatar_url: '',
  });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [customStatus, setCustomStatus] = useState('');

  const isOwner = user?.id === id;

  useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  async function fetchProfile() {
    setLoading(true);
    const [{ data: profileData }, { data: exerciseData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('exercises')
        .select('*, coaches(*)')
        .eq('coach_id', id)
        .eq('status', 'published')
        .order('created_at', { ascending: false }),
    ]);

    if (!profileData) {
      if (user?.id === id) {
        const { data: created } = await supabase
          .from('profiles')
          .insert({ id: user.id, role: 'user' })
          .select()
          .single();
        if (created) setProfile(created as Profile);
      } else {
        navigate('/');
        return;
      }
    } else {
      setProfile(profileData as Profile);
    }

    setExercises((exerciseData as Exercise[]) ?? []);
    setLoading(false);
  }

  function startEditing() {
    if (!profile) return;
    setEditForm({
      full_name: profile.full_name ?? '',
      bio: profile.bio ?? '',
      avatar_url: profile.avatar_url ?? '',
    });
    setSelectedStatuses(profile.hybrid_statuses ?? []);
    setCustomStatus('');
    setEditing(true);
  }

  function toggleStatus(s: string) {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function addCustomStatus() {
    const trimmed = customStatus.trim();
    if (!trimmed || selectedStatuses.includes(trimmed)) { setCustomStatus(''); return; }
    setSelectedStatuses((prev) => [...prev, trimmed]);
    setCustomStatus('');
  }

  function removeStatus(s: string) {
    setSelectedStatuses((prev) => prev.filter((x) => x !== s));
  }

  async function saveProfile() {
    if (!user || !profile) return;
    const updates = {
      ...editForm,
      hybrid_statuses: selectedStatuses,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) { showToast(error.message, 'error'); return; }
    setProfile({ ...profile, ...updates });
    setEditing(false);
    showToast('Profile updated', 'success');
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) { showToast(uploadError.message, 'error'); setUploadingAvatar(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    if (updateError) { showToast(updateError.message, 'error'); setUploadingAvatar(false); return; }
    setProfile((p) => p ? { ...p, avatar_url: publicUrl } : p);
    setEditForm((f) => ({ ...f, avatar_url: publicUrl }));
    setUploadingAvatar(false);
    showToast('Photo updated', 'success');
  }

  async function handleSave(exerciseId: string) {
    if (!user) { setShowLoginModal(true); return; }
    const nowSaved = await toggleSave(exerciseId);
    showToast(nowSaved ? 'Saved to your library' : 'Removed from your library', nowSaved ? 'success' : 'info');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!profile) return null;

  const displayName = profile.full_name || profile.username || user?.email?.split('@')[0] || 'Athlete';
  const initials = displayName.slice(0, 2).toUpperCase();
  const isCreatorOrAdmin = profile.role === 'creator' || profile.role === 'admin';
  const statuses = profile.hybrid_statuses ?? [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <Link to="/" className="flex items-center">
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.75rem', color: 'var(--text-primary)' }}>STAY</span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.75rem', color: 'var(--accent)' }}>HYBRID</span>
          </Link>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Profile card */}
        <div
          className="relative mb-10 p-8"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', animation: 'fadeUp 0.35s ease-out both' }}
        >
          {isOwner && !editing && (
            <button
              onClick={startEditing}
              className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 text-sm transition-all hover:opacity-80"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <Edit2 size={13} />
              Edit Profile
            </button>
          )}

          {editing && isOwner && (
            <div className="absolute top-6 right-6 flex items-center gap-2">
              <button
                onClick={saveProfile}
                className="flex items-center gap-2 px-4 py-2 text-sm transition-opacity hover:opacity-80"
                style={{ background: 'var(--accent)', color: '#000' }}
              >
                <Check size={13} />
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm transition-opacity hover:opacity-70"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                <X size={13} />
                Cancel
              </button>
            </div>
          )}

          <div className="flex items-start gap-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold"
                style={{ background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--accent)' }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                ) : initials}
              </div>
              {isOwner && editing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.6)', opacity: 0, transition: 'opacity 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0'; }}
                  >
                    {uploadingAvatar
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Camera size={20} color="white" />
                    }
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex flex-col gap-5 pr-32">
                  {/* Name */}
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
                      DISPLAY NAME
                    </label>
                    <input
                      value={editForm.full_name}
                      onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 text-sm outline-none"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                    />
                  </div>

                  {/* Hybrid Status multi-select */}
                  <div>
                    <label className="block text-xs mb-2" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
                      HYBRID STATUS — select all that apply
                    </label>

                    {/* Selected tags */}
                    {selectedStatuses.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {selectedStatuses.map((s) => (
                          <span
                            key={s}
                            className="flex items-center gap-1 px-3 py-1 text-xs"
                            style={{ background: 'rgba(200,255,0,0.12)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                          >
                            {s}
                            <button
                              type="button"
                              onClick={() => removeStatus(s)}
                              className="ml-0.5 hover:opacity-70"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Preset pills */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {HYBRID_STATUSES.map((s) => {
                        const active = selectedStatuses.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleStatus(s)}
                            className="px-3 py-1.5 text-xs transition-all"
                            style={{
                              background: active ? 'rgba(200,255,0,0.12)' : 'var(--surface)',
                              border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                              color: active ? 'var(--accent)' : 'var(--text-secondary)',
                            }}
                          >
                            {active ? '✓ ' : ''}{s}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom input */}
                    <div className="flex gap-2">
                      <input
                        value={customStatus}
                        onChange={(e) => setCustomStatus(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomStatus(); } }}
                        placeholder="Add custom (e.g. Decathlete)"
                        className="flex-1 px-3 py-2 text-xs outline-none"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                      />
                      <button
                        type="button"
                        onClick={addCustomStatus}
                        disabled={!customStatus.trim()}
                        className="px-3 py-2 text-xs transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ background: 'var(--accent)', color: '#000' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
                      BIO
                    </label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                      rows={4}
                      placeholder="Tell people about your training philosophy, goals, and what makes you hybrid..."
                      className="w-full px-4 py-2.5 text-sm outline-none resize-none"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', lineHeight: 1.6 }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h1
                      className="leading-none"
                      style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', letterSpacing: '0.02em' }}
                    >
                      {displayName}
                    </h1>
                    {isCreatorOrAdmin && (
                      <BadgeCheck size={22} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    )}
                  </div>

                  {/* Multi-status badges */}
                  {statuses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {statuses.map((s) => (
                        <span
                          key={s}
                          className="inline-block px-3 py-1 text-xs"
                          style={{
                            background: 'rgba(200,255,0,0.08)',
                            border: '1px solid rgba(200,255,0,0.2)',
                            color: 'var(--accent)',
                            fontFamily: "'Bebas Neue', sans-serif",
                            letterSpacing: '0.1em',
                          }}
                        >
                          {s.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}

                  {profile.bio ? (
                    <p className="text-sm leading-relaxed max-w-xl mb-4" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                      {profile.bio}
                    </p>
                  ) : isOwner ? (
                    <button onClick={startEditing} className="text-sm mb-4 transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                      + Add a bio
                    </button>
                  ) : null}

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl leading-none" style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif" }}>
                        {exercises.length}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Exercises</p>
                    </div>
                    <div
                      className="text-xs px-3 py-1 uppercase"
                      style={{
                        background: profile.role === 'admin' ? 'rgba(200,255,0,0.08)' : profile.role === 'creator' ? 'rgba(0,212,255,0.08)' : 'var(--surface)',
                        border: `1px solid ${profile.role === 'admin' ? 'rgba(200,255,0,0.3)' : profile.role === 'creator' ? 'rgba(0,212,255,0.3)' : 'var(--border)'}`,
                        color: profile.role === 'admin' ? 'var(--accent)' : profile.role === 'creator' ? '#00D4FF' : 'var(--text-muted)',
                        fontFamily: "'Bebas Neue', sans-serif",
                        letterSpacing: '0.1em',
                      }}
                    >
                      {profile.role}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Exercises section */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <h2 style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.75rem', letterSpacing: '0.04em' }}>
              {isOwner ? 'MY' : `${displayName.toUpperCase().split(' ')[0]}'S`} EXERCISES
            </h2>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{exercises.length}</span>
          </div>

          {exercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ border: '1px dashed var(--border)' }}>
              <p className="text-2xl" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif" }}>
                NO EXERCISES YET
              </p>
              {isOwner && isCreatorOrAdmin && (
                <Link
                  to="/admin/upload"
                  className="px-5 py-2.5 text-sm transition-opacity hover:opacity-80"
                  style={{ background: 'var(--accent)', color: '#000', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
                >
                  UPLOAD YOUR FIRST EXERCISE
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exercises.map((ex, i) => (
                <DataBlock
                  key={ex.id}
                  exercise={ex}
                  isSaved={savedIds.has(ex.id)}
                  onSave={() => handleSave(ex.id)}
                  onOpenLogin={() => setShowLoginModal(true)}
                  onOpenDetail={() => setSelectedExercise(ex)}
                  animationDelay={i * 50}
                />
              ))}
            </div>
          )}
        </div>
      </div>

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
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}
