export const CATEGORY_COLORS: Record<string, string> = {
  Speed: '#FF3C00',
  Strength: '#C8FF00',
  Power: '#FFB800',
  Stability: '#00D4FF',
  Mobility: '#9B59B6',
  Swimming: '#0099FF',
  Cycling: '#FF6B35',
  Running: '#FF3C00',
};

const CATEGORY_TEXT: Record<string, string> = {
  Speed: '#fff',
  Strength: '#000',
  Power: '#000',
  Stability: '#000',
  Mobility: '#fff',
  Swimming: '#000',
  Cycling: '#000',
  Running: '#fff',
};

type Props = {
  category: string;
  size?: 'sm' | 'md';
};

export default function CategoryBadge({ category, size = 'sm' }: Props) {
  const bg = CATEGORY_COLORS[category] ?? '#888';
  const color = CATEGORY_TEXT[category] ?? '#000';
  const cls = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-block font-bold tracking-wider uppercase ${cls}`}
      style={{
        backgroundColor: bg,
        color,
        fontFamily: "'Bebas Neue', sans-serif",
        letterSpacing: '0.08em',
      }}
    >
      {category}
    </span>
  );
}
