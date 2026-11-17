import { ImageWithFallback } from './ImageWithFallback';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');

  const sizeClass =
    size === 'sm'
      ? 'w-8 h-8 text-xs'
      : size === 'lg'
        ? 'w-20 h-20 text-xl'
        : 'w-10 h-10 text-sm';

  if (src) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100`}>
        <ImageWithFallback
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          fallbackTitle={initials}
        />
      </div>
    );
  }

  return (
    <div
      aria-label={name}
      className={`${sizeClass} rounded-full bg-slate-900 text-white font-display font-semibold flex items-center justify-center shrink-0 select-none`}
    >
      {initials || 'U'}
    </div>
  );
}
