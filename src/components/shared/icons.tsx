import { clsx } from 'clsx';

type IconProps = { className?: string };

/** A place on a map. Use for showing or opening a saved location. */
export function MapPinIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx('h-5 w-5', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  );
}

/**
 * Crosshair for "use my current position". Distinct from the pin on purpose: the pin
 * marks a place, this one asks the device where you are.
 */
export function LocateIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx('h-5 w-5', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
    </svg>
  );
}
