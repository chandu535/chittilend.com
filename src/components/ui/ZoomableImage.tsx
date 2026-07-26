import { useCallback, useState, type ImgHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { PhotoPreview } from './PhotoPreview';

interface OpenPreview {
  src: string;
  alt: string;
  originRect: DOMRect;
}

/**
 * Opens the full-screen preview from whatever element was tapped, so the zoom
 * animation starts at the thumbnail's real on-screen position.
 * Use this when the trigger is not a plain <img> — an avatar with a fallback
 * initial, for example. Otherwise reach for <ZoomableImage>.
 */
export function useImagePreview() {
  const [preview, setPreview] = useState<OpenPreview | null>(null);

  const open = useCallback((event: React.MouseEvent<HTMLElement>, src: string, alt: string) => {
    event.preventDefault();
    // Thumbnails often sit inside a link or a row that navigates.
    event.stopPropagation();
    setPreview({ src, alt, originRect: event.currentTarget.getBoundingClientRect() });
  }, []);

  const close = useCallback(() => setPreview(null), []);

  const previewElement = preview ? (
    <PhotoPreview
      src={preview.src}
      alt={preview.alt}
      originRect={preview.originRect}
      onClose={close}
    />
  ) : null;

  return { open, close, previewElement };
}

type ZoomableImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  src: string;
  alt: string;
  /** Full-resolution source, when the thumbnail points at a smaller one. */
  previewSrc?: string;
};

/** An <img> that opens a full-screen preview, zooming out of its own position. */
export function ZoomableImage({ src, alt, previewSrc, className, ...rest }: ZoomableImageProps) {
  const { open, previewElement } = useImagePreview();

  return (
    <>
      <img
        {...rest}
        src={src}
        alt={alt}
        onClick={(event) => open(event, previewSrc || src, alt)}
        className={clsx('cursor-zoom-in', className)}
        draggable={false}
      />
      {previewElement}
    </>
  );
}
