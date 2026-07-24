import { useState } from 'react';
import { clsx } from 'clsx';
import { useLocalizedName } from '@/components/shared/NameDisplay';
import { PhotoPreview } from '@/components/ui/PhotoPreview';

interface BorrowerAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BorrowerAvatar({ name, photoUrl, size = 'md', className }: BorrowerAvatarProps) {
  const [previewing, setPreviewing] = useState(false);
  const displayName = useLocalizedName(name);

  const sizeClass =
    size === 'sm' ? 'h-8 w-8 text-xs' :
    size === 'lg' ? 'h-14 w-14 text-xl' :
    'h-10 w-10 text-sm';

  const handleClick = (e: React.MouseEvent) => {
    if (!photoUrl) return;
    e.preventDefault();
    e.stopPropagation();
    setPreviewing(true);
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
            ? 'cursor-pointer ring-2 ring-white hover:ring-primary/40 transition-shadow'
            : 'bg-primary/10 text-primary',
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

      {previewing && photoUrl && (
        <PhotoPreview
          src={photoUrl}
          alt={displayName}
          onClose={() => setPreviewing(false)}
        />
      )}
    </>
  );
}
