import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PhotoPreviewProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function PhotoPreview({ src, alt, onClose }: PhotoPreviewProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      onClick={onClose}
    >
      {/* Photo area — tap backdrop to close, pinch/scroll to zoom */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain select-none rounded-lg"
          draggable={false}
        />
      </div>

      {/* Big close button at bottom */}
      <div className="shrink-0 flex justify-center pb-10 pt-4">
        <button
          onClick={onClose}
          className="h-16 w-16 rounded-full bg-white shadow-2xl flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Close"
        >
          <svg className="h-7 w-7 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  );
}
