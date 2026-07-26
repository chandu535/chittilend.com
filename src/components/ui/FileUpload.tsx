import { clsx } from 'clsx';
import { ZoomableImage } from '@/components/ui/ZoomableImage';
import { useRef, useState, useCallback, type ChangeEvent } from 'react';
import { DEFAULTS } from '@/lib/constants';

interface FileUploadProps {
  label?: string;
  error?: string;
  accept?: string;
  maxSize?: number;
  onFileSelect: (file: File | null) => void;
  className?: string;
  loading?: boolean;
}

export function FileUpload({
  label,
  error,
  accept = DEFAULTS.ALLOWED_IMAGE_TYPES.join(','),
  maxSize = DEFAULTS.MAX_FILE_SIZE,
  onFileSelect,
  className,
  loading = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setSizeError(null);

      if (!file) {
        setPreview(null);
        setFileName(null);
        onFileSelect(null);
        return;
      }

      if (file.size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024));
        setSizeError(`File size must be under ${maxMB}MB`);
        e.target.value = '';
        return;
      }

      setFileName(file.name);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }

      onFileSelect(file);
    },
    [maxSize, onFileSelect],
  );

  const handleClear = useCallback(() => {
    setPreview(null);
    setFileName(null);
    setSizeError(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onFileSelect]);

  const displayError = error || sizeError;

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <p className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </p>
      )}

      {preview ? (
        <div className="relative rounded-lg border border-slate-300 overflow-hidden">
          <ZoomableImage
            src={preview}
            alt="Preview"
            className="w-full max-h-48 object-contain bg-slate-50"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 shadow-sm hover:bg-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Remove file"
          >
            <svg className="h-4 w-4 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ) : fileName ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5">
          <span className="text-sm text-slate-700 truncate flex-1">{fileName}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Remove file"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={clsx(
            'w-full rounded-lg border-2 border-dashed px-4 py-6',
            'flex flex-col items-center gap-2',
            'text-sm text-slate-500',
            'hover:border-primary hover:text-primary transition-colors',
            'min-h-[48px]',
            displayError ? 'border-danger' : 'border-slate-300',
          )}
        >
          {loading ? (
            <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          )}
          <span>{loading ? 'Uploading...' : 'Tap to upload'}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />

      {displayError && (
        <p className="mt-1 text-sm text-danger">{displayError}</p>
      )}
    </div>
  );
}
