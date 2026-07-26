import { createServerFn } from '@tanstack/react-start';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { toTelugu } from '@/lib/transliterate';

// The engine behind Google Input Tools. Undocumented, so every failure path falls
// back to the local rules rather than surfacing an error — a rough suggestion the
// user can correct beats a blocked form.
const ENDPOINT = 'https://inputtools.google.com/request';
const TIMEOUT_MS = 4000;

type InputToolsResponse = ['SUCCESS' | string, Array<[string, string[]]>];

export const suggestTelugu = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const text = ((data as { text?: string }).text ?? '').trim();
    if (!text) throw new Error('Text is required');
    if (text.length > 100) throw new Error('Text is too long');
    return { text };
  })
  .handler(async ({ data }): Promise<{ suggestions: string[]; source: 'google' | 'local' }> => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const params = new URLSearchParams({
      text: data.text,
      itc: 'te-t-i0-und',
      num: '3',
      cp: '0',
      cs: '1',
      ie: 'utf-8',
      oe: 'utf-8',
    });

    try {
      const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) throw new Error('Transliteration service unavailable');

      const body = (await response.json()) as InputToolsResponse;
      const candidates = body[0] === 'SUCCESS' ? body[1]?.[0]?.[1] : undefined;
      if (!candidates?.length) throw new Error('No candidates returned');

      return { suggestions: candidates, source: 'google' };
    } catch {
      return { suggestions: [toTelugu(data.text)], source: 'local' };
    }
  });
