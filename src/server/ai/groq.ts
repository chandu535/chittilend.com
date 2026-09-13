/**
 * The model call.
 *
 * Groq speaks the OpenAI chat shape, so this is a fetch and not a dependency. Nothing about
 * the assistant's behaviour lives here — this file only knows how to ask.
 *
 * Deliberately swappable. The question of which provider should see borrower names and
 * amounts is not settled, and the answer may well be "not this one" once it leaves dev; the
 * rest of the feature does not know what it is talking to.
 */

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

export class ModelUnavailable extends Error {}

export interface AskModelOptions {
  system: string;
  user: string;
  /** Low for SQL, where there is a right answer; higher for phrasing. */
  temperature?: number;
  maxTokens?: number;
}

export async function askModel({
  system, user, temperature = 0, maxTokens = 700,
}: AskModelOptions): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new ModelUnavailable('No model key configured');

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      // A collector waiting at a doorstep will not wait thirty seconds for an answer.
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new ModelUnavailable('Could not reach the model');
  }

  if (!response.ok) {
    // The body can carry the key back in an error echo, so it is not surfaced or logged.
    throw new ModelUnavailable(`Model refused the request (${response.status})`);
  }

  const body = await response.json() as { choices?: { message?: { content?: string } }[] };
  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) throw new ModelUnavailable('Model returned nothing');

  return text;
}

/**
 * Pulls the query out of whatever the model wrapped it in.
 *
 * Asked for bare SQL it usually obliges, and sometimes returns a fenced block or a sentence
 * of preamble anyway. Stripping that here is cosmetic and safe — the guard still has to pass
 * whatever comes out, so a bad extraction fails closed rather than running something odd.
 */
export function extractSql(reply: string): string {
  const fenced = reply.match(/```(?:sql)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : reply).trim();

  // Some models open with a line of explanation before the query.
  const start = body.search(/\b(select|with)\b/i);
  return start > 0 ? body.slice(start).trim() : body;
}
