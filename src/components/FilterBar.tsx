import { Search, ChevronDown } from 'lucide-react';
import { CATEGORY_COLORS } from './CategoryBadge';
import { CATEGORIES as BASE_CATEGORIES, MUSCLE_GROUPS as BASE_MUSCLE_GROUPS } from '../constants/exercise';

const CATEGORIES = ['All', ...BASE_CATEGORIES];
const MUSCLE_GROUPS = ['All', ...BASE_MUSCLE_GROUPS];

type Props = {
  activeCategory: string;
  activeMuscle: string;
  search: string;
  onCategoryChange: (c: string) => void;
  onMuscleChange: (m: string) => void;
  onSearchChange: (s: string) => void;
};

export default function FilterBar({
  activeCategory,
  activeMuscle,
  search,
  onCategoryChange,
  onMuscleChange,
  onSearchChange,
}: Props) {
  return (
    <div
      className="sticky top-0 z-30 py-4"
      style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-3">
        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const color = cat === 'All' ? 'var(--accent)' : (CATEGORY_COLORS[cat] ?? '#888');
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className="flex-shrink-0 px-4 py-1.5 text-sm transition-all duration-150"
                style={{
                  background: isActive ? color : 'transparent',
                  color: isActive ? '#000' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? color : 'var(--border)'}`,
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: '0.06em',
                  fontSize: '13px',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Muscle + Search row */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={activeMuscle}
              onChange={(e) => onMuscleChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm cursor-pointer outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: activeMuscle !== 'All' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {MUSCLE_GROUPS.map((m) => (
                <option key={m} value={m} style={{ background: 'var(--surface)' }}>
                  {m === 'All' ? 'All Muscles' : m}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search exercises..."
              className="w-full pl-9 pr-4 py-2 text-sm outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
