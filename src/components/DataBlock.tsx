import { useState, useRef } from 'react';
import { Bookmark, Plus, Bot, Play } from 'lucide-react';
import { Exercise } from '../lib/supabase';
import CategoryBadge, { CATEGORY_COLORS } from './CategoryBadge';
import CoachTag from './CoachTag';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: '#3ECF8E',
  Intermediate: '#00D4FF',
  Advanced: '#FFB800',
  Elite: '#FF3C00',
};

function VideoArea({ url, title, category }: { url: string; title: string; category: string[] }) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const primaryCat = category?.[0];
  const gradColor = primaryCat ? CATEGORY_COLORS[primaryCat] ?? '#333' : '#333';

  function handleMouseEnter() {
    setHovered(true);
    videoRef.current?.play().catch(() => {});
  }
  function handleMouseLeave() {
    setHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  const isVideo = url && !url.includes('instagram.com');

  return (
    <div
      className="w-full aspect-video relative overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isVideo ? (
        <>
          <video
            ref={videoRef}
            src={url}
            muted
            loop
            playsInline
            preload="none"
            className="w-full h-full object-cover"
            style={{ background: '#000' }}
          />
          {!hovered && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.45)' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <Play size={16} fill="white" style={{ color: '#fff', marginLeft: 2 }} />
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          className="w-full h-full flex items-center justify-center relative"
          style={{
            background: `linear-gradient(135deg, ${gradColor}22 0%, #0a0a0a 60%)`,
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: `${gradColor}20`, border: `1px solid ${gradColor}40` }}
          >
            <Play size={16} fill={gradColor} style={{ color: gradColor, marginLeft: 2 }} />
          </div>
        </div>
      )}

      {/* Shimmer overlay on hover */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)',
          opacity: hovered ? 1 : 0,
        }}
      />
    </div>
  );
}

type Props = {
  exercise: Exercise;
  isSaved: boolean;
  onSave: () => void;
  onOpenLogin: () => void;
  onOpenDetail: () => void;
  onCategoryClick?: (cat: string) => void;
  animationDelay?: number;
};

export default function DataBlock({
  exercise, isSaved, onSave, onOpenLogin, onOpenDetail, onCategoryClick, animationDelay = 0,
}: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const coach = exercise.coaches;

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) { onOpenLogin(); return; }
    onSave();
  }

  function handleAddToPlan(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) { onOpenLogin(); return; }
    showToast('Add to Plan — coming soon', 'info');
  }

  function handleAskAI(e: React.MouseEvent) {
    e.stopPropagation();
    showToast('MyHybrid AI — coming soon', 'info');
  }

  return (
    <div
      className="flex flex-col cursor-pointer group"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        transition: 'border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
        animation: `fadeUp 0.4s ease-out ${animationDelay}ms both`,
      }}
      onClick={onOpenDetail}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = '#444';
        el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)';
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'var(--border)';
        el.style.boxShadow = 'none';
        el.style.transform = 'translateY(0)';
      }}
    >
      <div className="relative overflow-hidden">
        <VideoArea url={exercise.short_video_url} title={exercise.title} category={exercise.category} />

        {/* Difficulty badge — top right */}
        {exercise.difficulty && (
          <div className="absolute top-2 right-2">
            <span
              className="px-2 py-0.5 text-xs"
              style={{
                background: `${DIFFICULTY_COLORS[exercise.difficulty] ?? '#888'}22`,
                border: `1px solid ${DIFFICULTY_COLORS[exercise.difficulty] ?? '#888'}60`,
                color: DIFFICULTY_COLORS[exercise.difficulty] ?? '#888',
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: '0.08em',
              }}
            >
              {exercise.difficulty}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Categories — clickable */}
        <div className="flex flex-wrap gap-1">
          {exercise.category?.map((cat) => (
            <span
              key={cat}
              onClick={(e) => { e.stopPropagation(); onCategoryClick?.(cat); }}
            >
              <CategoryBadge category={cat} />
            </span>
          ))}
          {exercise.sets_reps && (
            <span
              className="inline-block px-2 py-0.5 text-xs font-medium"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              {exercise.sets_reps}
            </span>
          )}
        </div>

        <h3
          className="leading-none"
          style={{
            color: 'var(--text-primary)',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.5rem',
            letterSpacing: '0.02em',
          }}
        >
          {exercise.title || 'Exercise Title'}
        </h3>

        {coach && <CoachTag coach={coach} />}

        {exercise.muscle_group && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {exercise.muscle_group}
            {exercise.secondary_muscles?.length > 0 && ` · ${exercise.secondary_muscles.join(', ')}`}
          </span>
        )}

        {exercise.benefits && (
          <p
            className="text-sm flex-1"
            style={{
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {exercise.benefits}
          </p>
        )}

        <div
          className="flex items-center gap-2 mt-2 pt-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
            style={{
              background: isSaved ? 'var(--accent)' : 'transparent',
              border: `1px solid ${isSaved ? 'var(--accent)' : 'var(--border)'}`,
              color: isSaved ? '#000' : 'var(--text-secondary)',
            }}
          >
            <Bookmark size={12} fill={isSaved ? 'currentColor' : 'none'} />
            {isSaved ? 'Saved' : 'Save'}
          </button>

          <button
            onClick={handleAddToPlan}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <Plus size={12} />
            Plan
          </button>

          <button
            onClick={handleAskAI}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80 ml-auto"
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <Bot size={12} />
            AI
          </button>
        </div>
      </div>
    </div>
  );
}
