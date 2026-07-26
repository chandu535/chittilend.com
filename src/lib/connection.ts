/**
 * Marker used to tell the client that a request failed because the server could not
 * reach the database — not because anything is wrong with the request itself.
 * Kept as a plain string so it survives serialisation across the server-function
 * boundary, where Error subclasses do not.
 */
export const CONNECTION_ERROR = 'CONNECTION_ERROR';

/** True when the failure is a lost connection rather than a genuine application error. */
export function isConnectionError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  if (!error) return false;

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes(CONNECTION_ERROR)
    // Client-side fetch to our own server failing — the app itself is unreachable.
    || message.includes('Failed to fetch')
    || message.includes('NetworkError')
    || message.includes('Load failed')
    || message.includes('fetch failed')
    || message.includes('Error connecting to database')
  );
}

/** Recognises the driver/undici shapes that mean "could not reach the database". */
export function isDatabaseUnreachable(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;

  // Walk the cause chain: Drizzle wraps NeonDbError wraps the undici TypeError.
  while (current && !seen.has(current)) {
    seen.add(current);
    const message = current instanceof Error ? current.message : String(current);
    if (
      message.includes('fetch failed')
      || message.includes('Error connecting to database')
      || message.includes('ECONNREFUSED')
      || message.includes('ENOTFOUND')
      || message.includes('ETIMEDOUT')
      || message.includes('EAI_AGAIN')
    ) {
      return true;
    }
    current = (current as { cause?: unknown }).cause;
  }

  return false;
}
