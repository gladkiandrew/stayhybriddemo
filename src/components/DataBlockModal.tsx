import { useEffect } from 'react';
import { X, Bookmark, Plus, Bot, Share2, ExternalLink, Instagram } from 'lucide-react';
import { Exercise } from '../lib/supabase';
import CategoryBadge from './CategoryBadge';
import CoachTag from './CoachTag';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

function VideoEmbed({ url, title }: { url: string; title: string }) {
  const isInstagram = url?.includes('instagram.com');

  if (!url) {
    return (
      <div
        className="w-full aspect-video flex items-center justify-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>No video available</span>
      </div>
    );
  }

  if (isInstagram) {
    return (
      <div
        className="w-full aspect-video flex flex-col items-center justify-center gap-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <Instagram size={40} style={{ color: '#555' }} />
        <div className="flex flex-col items-center gap-3">
          <p
            className="text-xl"
            style={{ color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {title}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            <ExternalLink size={13} />
            Watch on Instagram
          </a>
        </div>
      </div>
    );
  }

  return (
    <video
      src={url}
      controls
      autoPlay
      muted
      playsInline
      className="w-full aspect-video object-cover"
      style={{ background: '#000' }}
    />
  );
}

type Props = {
  exercise: Exercise;
  isSaved: boolean;
  onSave: () => void;
  onOpenLogin: () => void;
  onClose: () => void;
};

export default function DataBlockModal({ exercise, isSaved, onSave, onOpenLogin, onClose }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const coach = exercise.coaches;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function handleSave() {
    if (!user) { onOpenLogin(); return; }
    onSave();
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard', 'success');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-5xl relative"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 transition-opacity hover:opacity-60"
          style={{ color: 'var(--text-secondary)' }}
        >
          <X size={20} />
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Left */}
          <div
            className="flex-1 p-6 lg:p-8 flex flex-col gap-6"
            style={{ borderRight: '1px solid var(--border)' }}
          >
            <VideoEmbed url={exercise.tutorial_video_url} title={exercise.title} />

            {exercise.benefits && (
              <div>
                <h4
                  className="text-xs mb-3"
                  style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em' }}
                >
                  WHY THIS EXERCISE
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: '1.75' }}>
                  {exercise.benefits}
                </p>
              </div>
            )}

            <div>
              <h4
                className="text-xs mb-3"
                style={{ color: 'var(--text-muted)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em' }}
              >
                MUSCLES
              </h4>
              <div className="flex flex-wrap gap-2">
                {exercise.muscle_group && (
                  <span
                    className="px-3 py-1 text-xs font-medium"
                    style={{ background: 'var(--surface)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                  >
                    {exercise.muscle_group}
                  </span>
                )}
                {exercise.secondary_muscles?.map((m) => (
                  <span
                    key={m}
                    className="px-3 py-1 text-xs font-medium"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="lg:w-[40%] p-6 lg:p-8 flex flex-col gap-6">
            <div className="flex flex-wrap gap-1">
              {exercise.category?.map((cat) => <CategoryBadge key={cat} category={cat} size="md" />)}
            </div>

            <h2
              className="leading-none"
              style={{
                color: 'var(--text-primary)',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                letterSpacing: '0.02em',
              }}
            >
              {exercise.title}
            </h2>

            {coach && (
              <div
                className="flex items-center gap-3 p-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <CoachTag coach={coach} size="md" />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 py-3 text-lg transition-all hover:opacity-80"
                style={{
                  background: isSaved ? 'var(--accent)' : 'transparent',
                  border: `1px solid ${isSaved ? 'var(--accent)' : 'var(--border)'}`,
                  color: isSaved ? '#000' : 'var(--text-primary)',
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: '0.08em',
                }}
              >
                <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                {isSaved ? 'SAVED' : 'SAVE EXERCISE'}
              </button>

              <button
                onClick={() => { if (!user) { onOpenLogin(); return; } showToast('Add to Plan — coming soon', 'info'); }}
                className="flex items-center justify-center gap-2 py-3 text-lg transition-all hover:opacity-80"
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
              >
                <Plus size={16} />
                ADD TO PLAN
              </button>

              <button
                onClick={() => showToast('MyHybrid AI — coming soon', 'info')}
                className="flex items-center justify-center gap-2 py-3 text-lg transition-all hover:opacity-80"
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
              >
                <Bot size={16} />
                ASK MYHYBRID
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 py-3 text-lg transition-all hover:opacity-80"
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
              >
                <Share2 size={16} />
                SHARE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
