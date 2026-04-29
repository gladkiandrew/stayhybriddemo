import { BadgeCheck } from 'lucide-react';
import { Coach } from '../lib/supabase';

type Props = {
  coach: Coach;
  size?: 'sm' | 'md';
};

export default function CoachTag({ coach, size = 'sm' }: Props) {
  const avatarSize = size === 'md' ? 'w-9 h-9' : 'w-5 h-5';
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';
  const iconSize = size === 'md' ? 14 : 11;

  return (
    <div className="flex items-center gap-1.5">
      {coach.avatar_url && (
        <img
          src={coach.avatar_url}
          alt={coach.name}
          className={`${avatarSize} rounded-full object-cover flex-shrink-0`}
        />
      )}
      <span className={`${textSize} font-medium`} style={{ color: 'var(--text-secondary)' }}>
        {coach.name}
      </span>
      {coach.verified && (
        <BadgeCheck size={iconSize} style={{ color: 'var(--accent)' }} />
      )}
    </div>
  );
}
