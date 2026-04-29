import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Upload, Film, CheckCircle, Star, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import CategoryBadge, { CATEGORY_COLORS } from '../../components/CategoryBadge';
import { Bookmark, Plus, Bot, BadgeCheck, Play } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = ['Speed', 'Strength', 'Power', 'Stability', 'Mobility', 'Swimming', 'Cycling', 'Running'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const MUSCLE_GROUPS = ['Legs', 'Glutes', 'Core', 'Back', 'Chest', 'Shoulders', 'Arms', 'Full Body'];
const EQUIPMENT_OPTIONS = ['No Equipment', 'Barbell', 'Dumbbell', 'Kettlebell', 'Cable', 'Machine', 'Band', 'Box', 'Sled', 'Pool', 'Bike', 'Track'];
const VISIBILITY_OPTIONS: ('free' | 'pro' | 'elite')[] = ['free', 'pro', 'elite'];

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: '#3ECF8E',
  Intermediate: '#00D4FF',
  Advanced: '#FFB800',
  Elite: '#FF3C00',
};

const DRAFT_KEY = 'stayhybrid_upload_draft';

// ─── Form Type ────────────────────────────────────────────────────────────────

type FormState = {
  title: string;
  category: string[];
  difficulty: string;
  muscle_group: string;
  secondary_muscles: string[];
  equipment: string[];
  sets_reps: string;
  rest_period: string;
  benefits: string;
  coaching_cues: string;
  common_mistakes: string;
  visibility: 'free' | 'pro' | 'elite';
  featured: boolean;
  status: 'draft' | 'published';
  short_video_url: string;
  tutorial_video_url: string;
};

const BLANK: FormState = {
  title: '',
  category: [],
  difficulty: 'Intermediate',
  muscle_group: '',
  secondary_muscles: [],
  equipment: [],
  sets_reps: '',
  rest_period: '',
  benefits: '',
  coaching_cues: '',
  common_mistakes: '',
  visibility: 'free',
  featured: false,
  status: 'published',
  short_video_url: '',
  tutorial_video_url: '',
};

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  editId?: string;
  initialData?: Partial<FormState>;
  onSaved?: () => void;
};

// ─── Video Drop Zone ──────────────────────────────────────────────────────────

function VideoDropZone({
  label,
  subtitle,
  file,
  previewUrl,
  onFile,
  progress,
}: {
  label: string;
  subtitle: string;
  file: File | null;
  previewUrl: string;
  onFile: (f: File | null) => void;
  progress: number;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('video/')) onFile(f);
  }

  const formatSize = (bytes: number) => {
    if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    return `${(bytes / 1e3).toFixed(0)} KB`;
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em' }}>
        {label}
      </p>

      {file && previewUrl ? (
        <div className="flex flex-col gap-2">
          <video
            src={previewUrl}
            controls
            muted
            playsInline
            className="w-full aspect-video object-cover"
            style={{ background: '#000', border: '1px solid var(--border)' }}
          />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => onFile(null)}
              className="text-xs px-3 py-1 transition-opacity hover:opacity-70"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              Remove
            </button>
          </div>
          {progress > 0 && progress < 100 && (
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${progress}%`, background: 'var(--accent)' }}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          className="relative flex flex-col items-center justify-center gap-3 py-8 cursor-pointer transition-all duration-150"
          style={{
            border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
            background: dragging ? 'rgba(200,255,0,0.03)' : 'var(--surface)',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div
            className="w-12 h-12 flex items-center justify-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <Film size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {dragging ? 'Drop to upload' : 'Drop your clip here'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────

function LivePreview({ form, shortPreviewUrl }: { form: FormState; shortPreviewUrl: string }) {
  const primaryCat = form.category[0];
  const gradColor = primaryCat ? CATEGORY_COLORS[primaryCat] ?? '#333' : '#333';

  return (
    <div className="sticky top-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
        <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em' }}>
          LIVE PREVIEW
        </p>
      </div>

      <div
        className="flex flex-col overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {/* Video area */}
        <div className="w-full aspect-video relative flex items-center justify-center" style={{ background: '#000' }}>
          {shortPreviewUrl ? (
            <video src={shortPreviewUrl} muted loop autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${gradColor}22 0%, #0a0a0a 70%)` }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: `${gradColor}20`, border: `1px solid ${gradColor}40` }}
              >
                <Play size={16} fill={gradColor} style={{ color: gradColor, marginLeft: 2 }} />
              </div>
            </div>
          )}

          {/* Difficulty overlay */}
          {form.difficulty && (
            <div className="absolute top-2 right-2">
              <span
                className="px-2 py-0.5 text-xs"
                style={{
                  background: `${DIFFICULTY_COLORS[form.difficulty] ?? '#888'}22`,
                  border: `1px solid ${DIFFICULTY_COLORS[form.difficulty] ?? '#888'}60`,
                  color: DIFFICULTY_COLORS[form.difficulty] ?? '#888',
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: '0.08em',
                }}
              >
                {form.difficulty}
              </span>
            </div>
          )}
        </div>

        {/* Card content */}
        <div className="p-4 flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {form.category.map((cat) => <CategoryBadge key={cat} category={cat} />)}
            {form.sets_reps && (
              <span
                className="inline-block px-2 py-0.5 text-xs font-medium"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                {form.sets_reps}
              </span>
            )}
          </div>

          <h3
            className="leading-none"
            style={{
              color: 'var(--text-primary)',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.4rem',
              letterSpacing: '0.02em',
              minHeight: '1.5rem',
            }}
          >
            {form.title || <span style={{ color: 'var(--text-muted)' }}>Exercise Title</span>}
          </h3>

          {/* Coach tag */}
          <div className="flex items-center gap-1.5">
            <img
              src="https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&w=400"
              alt="Mit Foley"
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Mit Foley</span>
            <BadgeCheck size={11} style={{ color: 'var(--accent)' }} />
          </div>

          {form.muscle_group && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {form.muscle_group}
              {form.secondary_muscles?.length > 0 && ` · ${form.secondary_muscles.join(', ')}`}
            </span>
          )}

          {form.benefits && (
            <p
              className="text-sm"
              style={{
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: '0.8rem',
              }}
            >
              {form.benefits}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            {[
              { icon: <Bookmark size={11} />, label: 'Save' },
              { icon: <Plus size={11} />, label: 'Plan' },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1 px-2.5 py-1 text-xs"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                {icon}{label}
              </div>
            ))}
            <div
              className="flex items-center gap-1 px-2.5 py-1 text-xs ml-auto"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              <Bot size={11} />AI
            </div>
          </div>
        </div>
      </div>

      {/* Visibility/featured indicators */}
      <div className="flex gap-2">
        <span
          className="px-3 py-1 text-xs uppercase"
          style={{
            background: form.visibility === 'free' ? 'rgba(200,255,0,0.1)' : form.visibility === 'pro' ? 'rgba(0,212,255,0.1)' : 'rgba(255,183,0,0.1)',
            border: `1px solid ${form.visibility === 'free' ? 'var(--accent)' : form.visibility === 'pro' ? '#00D4FF' : '#FFB800'}`,
            color: form.visibility === 'free' ? 'var(--accent)' : form.visibility === 'pro' ? '#00D4FF' : '#FFB800',
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: '0.08em',
          }}
        >
          {form.visibility}
        </span>
        {form.featured && (
          <span
            className="px-3 py-1 text-xs uppercase flex items-center gap-1"
            style={{ background: 'rgba(255,183,0,0.1)', border: '1px solid #FFB800', color: '#FFB800', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
          >
            <Star size={10} fill="#FFB800" />Featured
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span
        className="w-6 h-6 flex items-center justify-center text-xs"
        style={{ background: 'var(--accent)', color: '#000', fontFamily: "'Bebas Neue', sans-serif" }}
      >
        {number}
      </span>
      <h3 className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.14em' }}>
        {title}
      </h3>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UploadExercise({ editId, initialData, onSaved }: Props) {
  const { showToast } = useToast();
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [coachId, setCoachId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [coachLoading, setCoachLoading] = useState(true);

  useEffect(() => {
    if (!user) { setCoachLoading(false); return; }
    (async () => {
      if (role === 'admin') {
        const { data: coachData } = await supabase.from('coaches').select('id').eq('user_id', user.id).maybeSingle();
        if (coachData) setCoachId(coachData.id);
        setIsCreator(true);
        setCoachLoading(false);
        return;
      }
      const { data: coachData, error: coachError } = await supabase.from('coaches').select('id').eq('user_id', user.id).maybeSingle();
      if (coachError || !coachData) {
        setIsCreator(false);
        setCoachLoading(false);
        return;
      }
      setCoachId(coachData.id);
      setIsCreator(true);
      setCoachLoading(false);
    })();
  }, [user, role]);

  const [form, setForm] = useState<FormState>(() => {
    if (initialData) return { ...BLANK, ...initialData };
    // Load draft from localStorage if no editId
    if (!editId) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) return { ...BLANK, ...JSON.parse(saved) };
      } catch {}
    }
    return BLANK;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shortFile, setShortFile] = useState<File | null>(null);
  const [tutFile, setTutFile] = useState<File | null>(null);
  const [shortPreviewUrl, setShortPreviewUrl] = useState('');
  const [tutPreviewUrl, setTutPreviewUrl] = useState('');
  const [shortProgress, setShortProgress] = useState(0);
  const [tutProgress, setTutProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Handle file selection and create object URLs
  useEffect(() => {
    if (shortFile) {
      const url = URL.createObjectURL(shortFile);
      setShortPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setShortPreviewUrl('');
    }
  }, [shortFile]);

  useEffect(() => {
    if (tutFile) {
      const url = URL.createObjectURL(tutFile);
      setTutPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setTutPreviewUrl('');
    }
  }, [tutFile]);

  // Auto-save draft every 30s (only for new uploads)
  useEffect(() => {
    if (editId) return;
    const interval = setInterval(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [form, editId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: '' }));
  }

  function toggle<K extends keyof FormState>(key: K, item: string) {
    const arr = form[key] as string[];
    set(key, (arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]) as any);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.category.length) e.category = 'Select at least one category';
    if (!form.muscle_group) e.muscle_group = 'Select a primary muscle group';
    if (!form.benefits.trim()) e.benefits = 'Benefits description is required';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function uploadVideo(file: File, folder: string, onProgress: (p: number) => void): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    onProgress(10);
    const { error } = await supabase.storage.from('exercise-videos').upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);
    onProgress(100);
    return supabase.storage.from('exercise-videos').getPublicUrl(path).data.publicUrl;
  }

  async function handleSubmit(status: 'draft' | 'published') {
    if (status === 'published' && !validate()) return;
    setSaving(true);
    try {
      let short_video_url = form.short_video_url;
      let tutorial_video_url = form.tutorial_video_url;

      if (shortFile) short_video_url = await uploadVideo(shortFile, 'demos', setShortProgress);
      if (tutFile) tutorial_video_url = await uploadVideo(tutFile, 'tutorials', setTutProgress);

      let resolvedCoachId = coachId;
      if (!resolvedCoachId) {
        const { data: coachData } = await supabase.from('coaches').select('id').eq('user_id', user!.id).maybeSingle();
        resolvedCoachId = coachData?.id ?? null;
      }
      if (!resolvedCoachId) {
        showToast('Coach profile not found. Contact support.', 'error');
        setSaving(false);
        return;
      }

      const payload = { ...form, status, short_video_url, tutorial_video_url, coach_id: resolvedCoachId };

      console.log('User ID:', user?.id);
      console.log('Coach ID being used:', resolvedCoachId || coachId);
      console.log('Full payload:', payload);

      const { data, error } = editId
        ? await supabase.from('exercises').update(payload).eq('id', editId).select()
        : await supabase.from('exercises').insert(payload).select();

      console.log('Insert result:', data);
      console.log('Insert error:', error);

      if (error) {
        showToast(error.message, 'error');
      } else {
        // Clear draft
        try { localStorage.removeItem(DRAFT_KEY); } catch {}
        setSuccess(true);
        onSaved?.();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
    setSaving(false);
  }

  // ── Coach gate ───────────────────────────────────────────────────────────────
  if (coachLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-3" style={{ color: 'var(--text-muted)' }}>
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        Loading...
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
        <div
          className="w-16 h-16 flex items-center justify-center"
          style={{ background: 'rgba(255,60,0,0.08)', border: '1px solid var(--accent-red)' }}
        >
          <Upload size={28} style={{ color: 'var(--accent-red)' }} />
        </div>
        <div className="text-center">
          <h2
            className="text-3xl mb-2"
            style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}
          >
            NO CREATOR ACCOUNT
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            You don't have a creator account linked to your profile. Contact an admin to get set up.
          </p>
        </div>
      </div>
    );
  }

  // ── Success Screen ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 flex items-center justify-center"
            style={{ background: 'rgba(200,255,0,0.1)', border: '1px solid var(--accent)' }}
          >
            <CheckCircle size={32} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="text-center">
            <h2
              className="text-4xl mb-2"
              style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}
            >
              {editId ? 'EXERCISE UPDATED' : 'EXERCISE UPLOADED'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {form.title} has been {form.status === 'published' ? 'published' : 'saved as draft'}.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => { setForm(BLANK); setShortFile(null); setTutFile(null); setSuccess(false); }}
            className="px-6 py-3 text-lg transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: '#000', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
          >
            UPLOAD ANOTHER
          </button>
          <button
            onClick={() => navigate('/admin/exercises')}
            className="px-6 py-3 text-lg transition-opacity hover:opacity-70"
            style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
          >
            VIEW DATABASE
          </button>
        </div>
      </div>
    );
  }

  // ── Label style helpers ──────────────────────────────────────────────────────
  const label = (text: string, required = false) => (
    <label
      className="block text-xs mb-2"
      style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em' }}
    >
      {text}{required && <span style={{ color: 'var(--accent-red)' }}> *</span>}
    </label>
  );

  const inputCls = "w-full px-4 py-3 text-sm outline-none transition-all";
  const inputStyle = (hasError?: boolean) => ({
    background: 'var(--surface)',
    border: `1px solid ${hasError ? 'var(--accent-red)' : 'var(--border)'}`,
    color: 'var(--text-primary)',
  });
  const focusStyle = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = 'var(--accent)'; },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = errors[e.target.name] ? 'var(--accent-red)' : 'var(--border)'; },
  };

  return (
    <div className="flex gap-8 p-8">
      {/* ── Left: Form ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-8">
          <h1
            className="text-4xl"
            style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}
          >
            {editId ? 'EDIT EXERCISE' : 'UPLOAD EXERCISE'}
          </h1>
          {!editId && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Draft auto-saves every 30s
            </span>
          )}
        </div>

        <div className="flex flex-col gap-8">

          {/* ── Section 1: Identity ───────────────────────────────────────────── */}
          <section>
            <SectionHeader number="1" title="IDENTITY" />
            <div className="flex flex-col gap-5">

              {/* Title */}
              <div>
                {label('EXERCISE TITLE', true)}
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. Trap Bar Deadlift"
                  className={inputCls}
                  style={inputStyle(!!errors.title)}
                  {...focusStyle}
                />
                {errors.title && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{errors.title}</p>}
              </div>

              {/* Category */}
              <div>
                {label('CATEGORY', true)}
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const color = CATEGORY_COLORS[cat] ?? '#888';
                    const active = form.category.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggle('category', cat)}
                        className="px-4 py-1.5 text-sm transition-all"
                        style={{
                          background: active ? color : 'transparent',
                          border: `1px solid ${active ? color : 'var(--border)'}`,
                          color: active ? (cat === 'Strength' || cat === 'Power' || cat === 'Stability' || cat === 'Swimming' || cat === 'Cycling' ? '#000' : '#fff') : 'var(--text-secondary)',
                          fontFamily: "'Bebas Neue', sans-serif",
                          letterSpacing: '0.06em',
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                {errors.category && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{errors.category}</p>}
              </div>

              {/* Difficulty */}
              <div>
                {label('DIFFICULTY')}
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => {
                    const color = DIFFICULTY_COLORS[d];
                    const active = form.difficulty === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => set('difficulty', d)}
                        className="flex-1 py-2 text-sm transition-all"
                        style={{
                          background: active ? `${color}20` : 'transparent',
                          border: `1px solid ${active ? color : 'var(--border)'}`,
                          color: active ? color : 'var(--text-muted)',
                          fontFamily: "'Bebas Neue', sans-serif",
                          letterSpacing: '0.06em',
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 2: Classification ─────────────────────────────────────── */}
          <section>
            <SectionHeader number="2" title="CLASSIFICATION" />
            <div className="flex flex-col gap-5">

              {/* Primary Muscle */}
              <div>
                {label('PRIMARY MUSCLE GROUP', true)}
                <select
                  value={form.muscle_group}
                  onChange={(e) => set('muscle_group', e.target.value)}
                  className={`${inputCls} appearance-none cursor-pointer`}
                  style={inputStyle(!!errors.muscle_group)}
                >
                  <option value="" disabled style={{ background: 'var(--surface)' }}>Select muscle group</option>
                  {MUSCLE_GROUPS.map((m) => (
                    <option key={m} value={m} style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>{m}</option>
                  ))}
                </select>
                {errors.muscle_group && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{errors.muscle_group}</p>}
              </div>

              {/* Secondary Muscles */}
              <div>
                {label('SECONDARY MUSCLES')}
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.map((m) => {
                    const active = form.secondary_muscles.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggle('secondary_muscles', m)}
                        className="px-3 py-1.5 text-xs font-medium transition-all"
                        style={{
                          background: active ? 'var(--surface)' : 'transparent',
                          border: `1px solid ${active ? '#555' : 'var(--border)'}`,
                          color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                        }}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Equipment */}
              <div>
                {label('EQUIPMENT')}
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_OPTIONS.map((eq) => {
                    const active = form.equipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggle('equipment', eq)}
                        className="px-3 py-1.5 text-xs font-medium transition-all"
                        style={{
                          background: active ? 'var(--surface)' : 'transparent',
                          border: `1px solid ${active ? '#555' : 'var(--border)'}`,
                          color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                        }}
                      >
                        {eq}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 3: Prescription ───────────────────────────────────────── */}
          <section>
            <SectionHeader number="3" title="PRESCRIPTION" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                {label('SETS × REPS')}
                <input
                  type="text"
                  name="sets_reps"
                  value={form.sets_reps}
                  onChange={(e) => set('sets_reps', e.target.value)}
                  placeholder="e.g. 4x6 or 3x8-12 or AMRAP"
                  className={inputCls}
                  style={inputStyle()}
                  {...focusStyle}
                />
              </div>
              <div>
                {label('REST PERIOD')}
                <input
                  type="text"
                  name="rest_period"
                  value={form.rest_period}
                  onChange={(e) => set('rest_period', e.target.value)}
                  placeholder="e.g. 90 seconds"
                  className={inputCls}
                  style={inputStyle()}
                  {...focusStyle}
                />
              </div>
            </div>
          </section>

          {/* ── Section 4: Content ────────────────────────────────────────────── */}
          <section>
            <SectionHeader number="4" title="CONTENT" />
            <div className="flex flex-col gap-5">
              {[
                { key: 'benefits', lbl: 'BENEFITS', rows: 4, placeholder: 'Why should an elite athlete do this exercise?', required: true },
                { key: 'coaching_cues', lbl: 'COACHING CUES', rows: 4, placeholder: 'Key form points and technique tips' },
                { key: 'common_mistakes', lbl: 'COMMON MISTAKES', rows: 3, placeholder: 'What to avoid' },
              ].map(({ key, lbl, rows, placeholder, required }) => (
                <div key={key}>
                  {label(lbl, required)}
                  <textarea
                    name={key}
                    value={(form as any)[key]}
                    onChange={(e) => set(key as any, e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    className={`${inputCls} resize-none`}
                    style={inputStyle(!!(errors as any)[key])}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
                    onBlur={(e) => { e.target.style.borderColor = (errors as any)[key] ? 'var(--accent-red)' : 'var(--border)'; }}
                  />
                  <div className="flex justify-between mt-1">
                    {(errors as any)[key] && <p className="text-xs" style={{ color: 'var(--accent-red)' }}>{(errors as any)[key]}</p>}
                    <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                      {((form as any)[key] as string).length} chars
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section 5: Media ──────────────────────────────────────────────── */}
          <section>
            <SectionHeader number="5" title="MEDIA" />
            <div className="grid grid-cols-2 gap-4">
              <VideoDropZone
                label="SHORT DEMO VIDEO"
                subtitle="15-30 seconds · MP4"
                file={shortFile}
                previewUrl={shortPreviewUrl}
                onFile={setShortFile}
                progress={shortProgress}
              />
              <VideoDropZone
                label="TUTORIAL VIDEO"
                subtitle="Full coaching breakdown · MP4"
                file={tutFile}
                previewUrl={tutPreviewUrl}
                onFile={setTutFile}
                progress={tutProgress}
              />
            </div>
          </section>

          {/* ── Section 6: Publishing ─────────────────────────────────────────── */}
          <section>
            <SectionHeader number="6" title="PUBLISHING" />
            <div className="flex flex-col gap-5">

              {/* Visibility segmented control */}
              <div>
                {label('VISIBILITY')}
                <div className="flex" style={{ border: '1px solid var(--border)' }}>
                  {VISIBILITY_OPTIONS.map((v) => {
                    const active = form.visibility === v;
                    const color = v === 'free' ? 'var(--accent)' : v === 'pro' ? '#00D4FF' : '#FFB800';
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => set('visibility', v)}
                        className="flex-1 py-2.5 text-sm transition-all uppercase"
                        style={{
                          background: active ? `${color}15` : 'transparent',
                          color: active ? color : 'var(--text-muted)',
                          borderRight: v !== 'elite' ? '1px solid var(--border)' : 'none',
                          fontFamily: "'Bebas Neue', sans-serif",
                          letterSpacing: '0.1em',
                        }}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between py-3 px-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <Star size={14} />
                    <span className="text-sm">Feature on homepage</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => set('featured', !form.featured)}
                    style={{ color: form.featured ? 'var(--accent)' : 'var(--text-muted)' }}
                  >
                    {form.featured ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Submit buttons ─────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit('published')}
              className="flex-1 py-4 text-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#000', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> UPLOADING...</>
              ) : (
                <><Upload size={18} />{editId ? 'UPDATE EXERCISE' : 'PUBLISH NOW'}</>
              )}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit('draft')}
              className="px-6 py-4 text-xl transition-opacity hover:opacity-70 disabled:opacity-50"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
            >
              SAVE DRAFT
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Live Preview ──────────────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0">
        <LivePreview form={form} shortPreviewUrl={shortPreviewUrl} />
      </div>
    </div>
  );
}
