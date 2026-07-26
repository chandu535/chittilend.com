import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/lib/useScrollLock';

interface PhotoPreviewProps {
  src: string;
  alt: string;
  /**
   * Viewport rect of the thumbnail that was tapped. The preview grows out of it and
   * shrinks back into it on close. Without it the preview simply fades.
   */
  originRect?: DOMRect | null;
  onClose: () => void;
}

const DURATION_MS = 280;
const EASING = 'cubic-bezier(0.2, 0, 0, 1)';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function fade(element: Element | null, from: number, to: number): Animation | null {
  if (!element) return null;
  return element.animate([{ opacity: from }, { opacity: to }], {
    duration: DURATION_MS,
    easing: EASING,
    fill: 'both',
  });
}

export function PhotoPreview({ src, alt, originRect, onClose }: PhotoPreviewProps) {
  useScrollLock(true);

  const backdropRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const closingRef = useRef(false);
  const [ready, setReady] = useState(false);

  /**
   * FLIP: the image is already laid out at its final size, so we invert it back onto
   * the thumbnail's box and play it forward. Measuring at run time is what makes this
   * correct at every screen size rather than only the one it was tuned on.
   */
  const zoom = useCallback((direction: 'in' | 'out'): Animation | null => {
    const image = imageRef.current;
    const opening = direction === 'in';

    fade(backdropRef.current, opening ? 0 : 1, opening ? 1 : 0);
    fade(chromeRef.current, opening ? 0 : 1, opening ? 1 : 0);

    if (!image) return null;

    const final = image.getBoundingClientRect();
    if (!originRect || prefersReducedMotion() || !final.width || !final.height) {
      return fade(image, opening ? 0 : 1, opening ? 1 : 0);
    }

    const scaleX = originRect.width / final.width;
    const scaleY = originRect.height / final.height;
    const translateX = (originRect.left + originRect.width / 2) - (final.left + final.width / 2);
    const translateY = (originRect.top + originRect.height / 2) - (final.top + final.height / 2);

    const atOrigin: Keyframe = {
      transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`,
      // Match the thumbnail's rounding so circular avatars do not pop square.
      borderRadius: `${Math.min(originRect.width, originRect.height) / 2 / Math.min(scaleX, scaleY)}px`,
      opacity: 0.5,
    };
    const atRest: Keyframe = {
      transform: 'translate(0px, 0px) scale(1, 1)',
      borderRadius: '8px',
      opacity: 1,
    };

    return image.animate(opening ? [atOrigin, atRest] : [atRest, atOrigin], {
      duration: DURATION_MS,
      easing: EASING,
      fill: 'both',
    });
  }, [originRect]);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const animation = zoom('out');
    if (!animation) {
      onClose();
      return;
    }
    animation.onfinish = () => onClose();
    animation.oncancel = () => onClose();
  }, [zoom, onClose]);

  // Play once the image has real dimensions, otherwise the measured rect is empty.
  useLayoutEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    if (image.complete && image.naturalWidth > 0) {
      setReady(true);
      zoom('in');
      return;
    }

    const onLoad = () => {
      setReady(true);
      zoom('in');
    };
    image.addEventListener('load', onLoad);
    image.addEventListener('error', onLoad);
    return () => {
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onLoad);
    };
  }, [zoom]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  return createPortal(
    <div className="fixed inset-0 z-[100]" onClick={close}>
      <div ref={backdropRef} className="absolute inset-0 bg-black/95" style={{ opacity: 0 }} />

      <div className="relative h-full flex flex-col">
        {/* Photo area — tap backdrop to close, pinch/scroll to zoom */}
        <div
          className="flex-1 min-h-0 overflow-auto overscroll-contain flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
          style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
        >
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain select-none"
            style={{ opacity: ready ? undefined : 0, borderRadius: 8, willChange: 'transform' }}
            draggable={false}
          />
        </div>

        {/* Big close button at bottom */}
        <div ref={chromeRef} className="shrink-0 flex justify-center pb-10 pt-4" style={{ opacity: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="h-16 w-16 rounded-full bg-white shadow-2xl flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Close"
          >
            <svg className="h-7 w-7 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
