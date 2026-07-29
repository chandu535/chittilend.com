import { clsx } from 'clsx';
import { useLocalizedName } from '@/components/shared/NameDisplay';
import { useImagePreview } from '@/components/ui/ZoomableImage';

interface BorrowerAvatarProps {
  name: string;
  /** Human-confirmed Telugu spelling. Without it the avatar guesses, and a guess that
      disagrees with the name shown beside it looks like a bug. */
  nameTelugu?: string | null;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BorrowerAvatar({ name, nameTelugu, photoUrl, size = 'md', className }: BorrowerAvatarProps) {
  const { open, previewElement } = useImagePreview();
  const displayName = useLocalizedName(name, nameTelugu);

  const sizeClass =
    size === 'sm' ? 'h-8 w-8 text-xs' :
    size === 'lg' ? 'h-14 w-14 text-xl' :
    'h-10 w-10 text-sm';

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!photoUrl) return;
    open(e, photoUrl, displayName);
  };

  return (
    <>
      <div
        role={photoUrl ? 'button' : undefined}
        aria-label={photoUrl ? `View photo of ${displayName}` : undefined}
        onClick={handleClick}
        className={clsx(
          sizeClass,
          'rounded-full shrink-0 overflow-hidden flex items-center justify-center font-semibold select-none',
          photoUrl
            ? 'cursor-pointer ring-2 ring-white hover:ring-brand/40 transition-shadow'
            : 'bg-primary/10 text-brand',
          className,
        )}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={displayName}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <span>{displayName.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {previewElement}
    </>
  );
}
