/**
 * Runs work after the response has gone out, without the caller waiting for it.
 *
 * A plain un-awaited promise is not enough on a serverless host: the process is frozen the
 * instant the response is written, so a detached promise is suspended mid-flight and
 * usually never resumes. `waitUntil` is the platform's answer — it says "I have sent my
 * reply, but keep me alive until this settles".
 *
 * There is no standard way to reach it, so this tries the two that exist here and falls
 * back to detaching:
 *
 *   1. Vercel's request context. The Node runtime this project builds for (`vercel.node`)
 *      does not attach `waitUntil` to the request, so this symbol is the only route. It is
 *      the same lookup `@vercel/functions` does internally, which is why that dependency
 *      is not needed for one function.
 *   2. The request object, which Nitro's *web* preset does decorate. Kept so switching
 *      preset does not quietly turn this back into fire-and-forget.
 *   3. Detached, for the dev server and anywhere unrecognised.
 *
 * The fallback is safe here in a way it usually is not, and that is not luck — it is why
 * `requestSheetSync` commits the dirty flag *before* handing over. Losing the background
 * run then costs a delay, never a change: the next mutation or the cron rebuilds from the
 * database and the sheet is right again.
 */
import { getRequest } from '@tanstack/react-start/server';

type WaitUntil = (promise: Promise<unknown>) => void;

const VERCEL_REQUEST_CONTEXT = Symbol.for('@vercel/request-context');

function findWaitUntil(): WaitUntil | null {
  const context = (globalThis as Record<symbol, unknown>)[VERCEL_REQUEST_CONTEXT] as
    | { get?: () => { waitUntil?: WaitUntil } | undefined }
    | undefined;
  const fromVercel = context?.get?.()?.waitUntil;
  if (typeof fromVercel === 'function') return fromVercel;

  try {
    const request = getRequest() as unknown as { waitUntil?: WaitUntil };
    if (typeof request?.waitUntil === 'function') return request.waitUntil.bind(request);
  } catch {
    // Called outside a request — a script or a cron. Nothing is waiting on a response
    // there, so the caller awaiting the work directly is the right thing.
  }

  return null;
}

export function afterResponse(work: () => Promise<unknown>): void {
  // Started here rather than inside the branch, so the work is already in flight by the
  // time the response is written either way.
  const promise = work().catch((error) => {
    console.error('[sheet-sync] background work failed:', error);
  });

  findWaitUntil()?.(promise);
}
