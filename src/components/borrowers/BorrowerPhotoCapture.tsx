import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { fileToBase64 } from '@/lib/fileToBase64';
import { uploadBorrowerPhoto } from '@/server/functions/upload';

interface BorrowerPhotoCaptureProps {
  borrowerId: string;
  name: string;
  nameTelugu?: string | null;
  photoUrl?: string | null;
  /** Refetch, so the new photo replaces the old one. */
  onUploaded: () => void | Promise<void>;
  /** Without borrowers.write the avatar is left exactly as it was, with no camera on it. */
  canEdit: boolean;
}

const CameraIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>
);

/**
 * The borrower's photo, with a way to take one.
 *
 * Two ways in, deliberately. The badge on the corner is always there, because replacing a
 * photo that came out badly has to be possible. Where there is no photo yet the avatar
 * itself is the button too — a bare initial is the most obvious thing on the card to press,
 * and asking someone to hit a 24px badge instead is a worse first step than it needs to be.
 *
 * Once a photo exists the avatar goes back to opening the zoom preview, since by then
 * looking is the commoner intent and the badge is right there for the rest.
 *
 * Uploads on capture rather than waiting for a save: there is no form around this, and a
 * photo taken on someone's doorstep should survive the phone being locked on the walk back.
 */
export function BorrowerPhotoCapture({
  borrowerId,
  name,
  nameTelugu,
  photoUrl,
  onUploaded,
  canEdit,
}: BorrowerPhotoCaptureProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);

  const avatar = (
    <BorrowerAvatar name={name} nameTelugu={nameTelugu} photoUrl={photoUrl} size="lg" />
  );

  if (!canEdit) return avatar;

  const handleCapture = async (file: File) => {
    setUploading(true);
    try {
      await uploadBorrowerPhoto({
        data: {
          borrowerId,
          docType: 'profile',
          fileData: await fileToBase64(file),
          contentType: file.type,
        },
      });
      toast(t('borrowers.photoUpdated'), 'success');
      await onUploaded();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <CameraCapture
      onCapture={handleCapture}
      // The face is the subject and the phone is usually held out towards the person, so
      // the back lens is right here as elsewhere; the switch inside handles the rest.
      defaultFacing="environment"
      // The stored photo is what should appear once this returns, not a local preview that
      // would sit there until the refetch landed and then swap.
      keepPreview={false}
      renderTrigger={({ open, starting }) => (
        <div className="relative shrink-0">
          {avatar}

          {/* Covers the avatar only while it has no photo, so it does not steal the tap
              that opens the zoom preview once there is one to look at. */}
          {!photoUrl && (
            <button
              type="button"
              onClick={open}
              disabled={starting || uploading}
              aria-label={t('borrowers.capturePhoto')}
              className="absolute inset-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            />
          )}

          <button
            type="button"
            onClick={open}
            disabled={starting || uploading}
            aria-label={photoUrl ? t('borrowers.replacePhoto') : t('borrowers.capturePhoto')}
            className={clsx(
              'absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full',
              'bg-primary text-white shadow-md ring-2 ring-white transition-colors',
              'hover:bg-primary/90 focus:outline-none focus-visible:ring-primary/50',
              'disabled:opacity-60',
            )}
          >
            <CameraIcon className="h-3.5 w-3.5" />
          </button>

          {(starting || uploading) && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
              <Spinner size="sm" />
            </div>
          )}
        </div>
      )}
    />
  );
}
