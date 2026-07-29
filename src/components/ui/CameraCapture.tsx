import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ZoomableImage } from '@/components/ui/ZoomableImage';
import { useScrollLock } from '@/lib/useScrollLock';

type Facing = 'environment' | 'user';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  /**
   * Where the photo was taken. Reported only once a photo actually exists — opening the
   * camera and closing it again should not stamp a location on anything.
   */
  onLocation?: (lat: number, lng: number) => void;
  /** Wording on the button that opens the camera. */
  label?: string;
  /** Which lens to open with. A document wants the back one, a face either. */
  defaultFacing?: Facing;
  /**
   * Replaces the default full-width button with something the caller draws — a camera
   * badge on an avatar, say. Given the opener and whether the camera is still warming up.
   */
  renderTrigger?: (props: { open: () => void; starting: boolean }) => ReactNode;
  /**
   * Whether to hold the captured shot on screen with a Retake beneath it. True suits a
   * form, where the photo is not saved until the form is. A caller that uploads the file
   * the moment it arrives passes false and shows the stored photo itself.
   */
  keepPreview?: boolean;
}

/**
 * Takes a photo, full screen.
 *
 * A viewfinder sitting in a form column is too small to frame a face or read an Aadhaar
 * card, and the phone is usually held at arm's length from someone else. Full screen
 * gives the whole display to the picture and puts a large shutter where a thumb rests.
 *
 * Portalled to the body: this renders inside cards and list rows, and anything with
 * `contain: paint` above it — `.list-row` has it — would become the containing block for
 * a fixed element and clip the whole thing.
 */
const SIZE = { width: { ideal: 1280 }, height: { ideal: 960 } };

/** Labels are the only way to tell the lenses apart when the constraints are refused. */
const LENS_LABEL: Record<Facing, RegExp> = {
  user: /front|user|self|face/i,
  environment: /back|rear|environment|world|main/i,
};

/**
 * Opens one lens, trying three ways before giving up.
 *
 * `facingMode` as a bare string is a preference the browser may ignore, so `exact` is asked
 * for first. But several Android builds reject `exact` for a lens they demonstrably have,
 * and on those the device list still names it — so a labelled `deviceId` is the second
 * attempt, and the loose preference the third. A refusal is final and returns immediately:
 * asking a second time only fails a second time.
 */
async function requestCamera(which: Facing): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: which }, ...SIZE },
    });
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') throw err;
  }

  const devices = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[]);
  const match = devices.find((d) => d.kind === 'videoinput' && LENS_LABEL[which].test(d.label));
  if (match) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: match.deviceId }, ...SIZE },
      });
    } catch {
      // Fall through to the loose request below.
    }
  }

  return navigator.mediaDevices.getUserMedia({ video: { facingMode: which, ...SIZE } });
}

export function CameraCapture({
  onCapture,
  onLocation,
  label,
  defaultFacing = 'environment',
  renderTrigger,
  keepPreview = true,
}: CameraCaptureProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<Facing>(defaultFacing);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  // Whether this device has more than one camera. Offering a switch on a laptop with a
  // single webcam is a button that does nothing.
  const [hasSeveralCameras, setHasSeveralCameras] = useState(false);

  // Asked for as the camera opens so the fix has time to arrive, but held here until the
  // shutter is pressed. A refusal simply leaves it null: location is never required.
  const coords = useRef<{ lat: number; lng: number } | null>(null);

  /*
    The live stream and the lens it came from, mirrored outside React state.

    Switching has to release the old lens synchronously, before the next request goes out,
    and state read from a closure is a render behind by then. These two are the truth for
    the teardown; the state versions exist to drive the rendering.
  */
  const streamRef = useRef<MediaStream | null>(null);
  const facingRef = useRef<Facing>(defaultFacing);

  useScrollLock(Boolean(stream));

  useEffect(() => {
    const video = videoRef.current;
    if (!stream || !video) return;
    video.srcObject = stream;
    // Swapping srcObject on an already-playing element leaves it paused on iOS, where the
    // autoplay attribute only applies to the first source it was given.
    void video.play().catch(() => {});
  }, [stream]);

  // A live camera left running holds the lens and drains the battery, so whatever is open
  // is stopped on unmount — navigating away mid-capture included.
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const open = useCallback(async (which: Facing) => {
    setStarting(true);
    setError(null);

    /*
      Release the lens that is open before asking for the other one.

      A phone serves one camera at a time. Requesting the front while the back is still
      streaming throws NotReadableError on most Android browsers — and because the previous
      code only retried on OverconstrainedError, that landed in the outer catch, left the
      back camera running, and wrote an error into the trigger, which is underneath the
      fullscreen overlay. Nothing appeared to happen, which is exactly what was reported.
    */
    const previous = streamRef.current;
    const previousFacing = facingRef.current;
    if (previous) {
      previous.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const adopt = (media: MediaStream, lens: Facing) => {
      streamRef.current = media;
      facingRef.current = lens;
      setStream(media);
      setFacing(lens);
    };

    try {
      adopt(await requestCamera(which), which);

      // Labels and the full device list only appear once permission has been granted,
      // so this is asked after the stream opens rather than before.
      void navigator.mediaDevices.enumerateDevices()
        .then((devices) => setHasSeveralCameras(devices.filter((d) => d.kind === 'videoinput').length > 1))
        .catch(() => setHasSeveralCameras(false));

      if (onLocation && navigator.geolocation) {
        coords.current = null;
        navigator.geolocation.getCurrentPosition(
          (pos) => { coords.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
          () => {
            // Refused or unavailable. Location is optional, so this is silent — the form
            // still takes a pasted map link or the manual capture button.
          },
          { enableHighAccuracy: true, timeout: 10000 },
        );
      }
    } catch {
      /*
        The lens we were on has already been given up, so put it back rather than leaving a
        black screen. This is what the old ordering was protecting against — it is just done
        by reopening afterwards instead of holding the hardware during the request, which is
        the thing that made switching fail in the first place.
      */
      if (previous) {
        try {
          adopt(await requestCamera(previousFacing), previousFacing);
          setError(t('borrowers.cameraSwitchFailed'));
        } catch {
          streamRef.current = null;
          setStream(null);
          setError(t('borrowers.cameraUnavailable'));
        }
      } else {
        setError(t('borrowers.cameraUnavailable'));
      }
    } finally {
      setStarting(false);
    }
  }, [onLocation, t]);

  const close = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // The front lens is mirrored on screen so it behaves like a mirror; the saved image
    // has to be un-mirrored or the writing on a card comes out backwards.
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    // The frame is on the canvas the moment drawImage returns, so the camera is released
    // and the overlay dismissed now. Encoding a 1280x960 JPEG takes a noticeable moment,
    // and waiting for it before closing made the shutter feel like it had hung.
    close();

    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      if (keepPreview) setPreview(URL.createObjectURL(blob));
      // The photo now exists, so where it was taken means something.
      if (coords.current) onLocation?.(coords.current.lat, coords.current.lng);
    }, 'image/jpeg', 0.85);
  }, [facing, onCapture, onLocation, close, keepPreview]);

  const retake = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    void open(facing);
  }, [preview, open, facing]);

  if (preview) {
    return (
      <div className="space-y-2">
        <ZoomableImage src={preview} alt={label ?? t('borrowers.capturePhoto')} className="w-full rounded-lg" />
        <Button variant="ghost" size="sm" onClick={retake} className="w-full">
          {t('borrowers.retakePhoto')}
        </Button>
      </div>
    );
  }

  return (
    <>
      {renderTrigger ? renderTrigger({ open: () => void open(facing), starting }) : (
      <Button variant="secondary" onClick={() => open(facing)} loading={starting} className="w-full">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        </svg>
        {label ?? t('borrowers.capturePhoto')}
      </Button>
      )}

      {/* Only when the camera is closed. While it is open the overlay covers this, so the
          message has to be shown inside the overlay instead — see below. */}
      {error && !stream && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}

      {stream && createPortal(
        <div className="fixed inset-0 z-[60] flex flex-col bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            // object-contain rather than cover: cropping the preview would hide the edges
            // of a card that the saved photo actually contains.
            className={`min-h-0 flex-1 object-contain ${facing === 'user' ? 'scale-x-[-1]' : ''}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* The caption spans the full width and overlaps the close button's corner, so
              it must not take pointer events — as a sibling painted after the button it
              was swallowing every tap on it. It is text; nothing should ever click it. */}
          {label && (
            <p
              className="pointer-events-none absolute left-0 right-0 px-20 text-center text-sm font-medium text-white/90"
              style={{ top: 'calc(env(safe-area-inset-top) + 1.6rem)' }}
            >
              {label}
            </p>
          )}

          {/* Last, so it sits above the caption whatever the caption does. */}
          <button
            type="button"
            onClick={close}
            aria-label={t('common.cancel')}
            className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors active:bg-black/70"
            style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* A switch that could not be honoured has to say so here. Reported into the
              trigger underneath, it was invisible, and the lens simply appeared not to
              change. Sits above the controls so it cannot cover the shutter. */}
          {error && (
            <p
              role="status"
              className="pointer-events-none absolute inset-x-4 rounded-lg bg-black/70 px-3 py-2 text-center text-sm text-white backdrop-blur"
              style={{ bottom: 'calc(env(safe-area-inset-bottom) + 7.5rem)' }}
            >
              {error}
            </p>
          )}

          <div
            className="flex shrink-0 items-center justify-between px-8 py-6"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
          >
            <span className="w-14" aria-hidden />

            <button
              type="button"
              onClick={capture}
              aria-label={t('borrowers.capturePhoto')}
              className="h-[72px] w-[72px] rounded-full border-4 border-white/80 bg-white/20 transition-transform active:scale-95"
            >
              <span className="mx-auto block h-14 w-14 rounded-full bg-card" />
            </button>

            {hasSeveralCameras ? (
              <button
                type="button"
                onClick={() => open(facing === 'environment' ? 'user' : 'environment')}
                disabled={starting}
                aria-label={t('borrowers.switchCamera')}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white transition-colors active:bg-white/25 disabled:opacity-40"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 4v5h-5M4 20v-5h5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 9A8 8 0 004.6 15M4.6 15A8 8 0 0019.4 9" />
                </svg>
              </button>
            ) : (
              <span className="w-14" aria-hidden />
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
