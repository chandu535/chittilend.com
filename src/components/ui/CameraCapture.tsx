import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onLocation?: (lat: number, lng: number) => void;
}

export function CameraCapture({ onCapture, onLocation }: CameraCaptureProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Assign srcObject after the video element mounts (state update renders it first)
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      setStream(mediaStream);

      // Request GPS simultaneously
      if (onLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => onLocation(pos.coords.latitude, pos.coords.longitude),
          () => {
            // GPS denied — ignore, manual fallback handled by parent
          },
          { enableHighAccuracy: true, timeout: 10000 },
        );
      }
    } catch {
      setError('Camera not available');
    }
  }, [onLocation]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          setPreview(URL.createObjectURL(blob));
          onCapture(file);

          // Stop camera
          stream?.getTracks().forEach((t) => t.stop());
          setStream(null);
        }
      },
      'image/jpeg',
      0.85,
    );
  }, [stream, onCapture]);

  const reset = useCallback(() => {
    setPreview(null);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  if (error) {
    return (
      <p className="text-sm text-red-500 text-center py-4">{error}</p>
    );
  }

  if (preview) {
    return (
      <div className="space-y-2">
        <img src={preview} alt="Captured" className="w-full rounded-lg" />
        <Button variant="ghost" size="sm" onClick={reset} className="w-full">
          {t('common.edit')}
        </Button>
      </div>
    );
  }

  if (stream) {
    return (
      <div className="space-y-2">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full rounded-lg bg-black"
        />
        <canvas ref={canvasRef} className="hidden" />
        <Button onClick={capture} className="w-full">
          {t('borrowers.capturePhoto')}
        </Button>
      </div>
    );
  }

  return (
    <Button variant="secondary" onClick={startCamera} className="w-full">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
      {t('borrowers.capturePhoto')}
    </Button>
  );
}
