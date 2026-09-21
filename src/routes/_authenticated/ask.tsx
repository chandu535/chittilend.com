import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollPage } from '@/components/layout/PageLayout';
import { Spinner } from '@/components/ui/Spinner';
import { VoiceAgent } from '@/components/ai/VoiceAgent';
import { askLedger, type AskResult } from '@/server/functions/ask';
import { userFacingError } from '@/lib/userError';
import { useSpeech } from '@/lib/useSpeech';

export const Route = createFileRoute('/_authenticated/ask')({
  component: AskPage,
});

/** One exchange. Kept so the screen reads as a conversation rather than a search box. */
interface Turn {
  question: string;
  result: AskResult | null;
  failed?: string;
}

/**
 * How many lines will read themselves without being asked.
 *
 * Short enough that it finishes while you are still holding the question in mind, and long
 * enough to cover a normal day's collections. Beyond it the list is offered rather than
 * started, since eighty names beginning unprompted is hard to sit through and harder to
 * stop on a phone in one hand.
 */
const AUTO_READ_LIMIT = 15;

const EXAMPLES = [
  'ఈ నెల ఎవరు డబ్బులు కట్టలేదో చెప్పు',
  'మనకి ఇంకా రావాల్సిన డబ్బు ఈ నెల ఎంత',
  'ఎంత మంది అప్పుదారులు ఉన్నారు',
];

/**
 * Asking the ledger a question.
 *
 * The answer arrives in two forms because one of them is no use on its own. Eighty-four
 * unpaid instalments cannot be spoken — anybody listening loses count by the fourth — and a
 * single number is a poor thing to read off a table. So the sentence says how many and how
 * much, and the rows underneath hold the detail.
 *
 * The query is shown under every answer. Not for developers: a generated query can be valid,
 * safe, and quietly answer a slightly different question than the one asked, and that is the
 * failure this feature will actually have. Being able to look at what ran is the only defence
 * against it, so it is on the screen rather than in a log.
 */
function AskPage() {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [asking, setAsking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Reuses the day book's voice: same picker, same Telugu-first fallback, same mute.
  const { speakText, speakList, cancel, reading, available: canSpeak } = useSpeech();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, asking]);

  const ask = async (text: string) => {
    const asked = text.trim();
    if (!asked || asking) return;

    setQuestion('');
    setAsking(true);
    try {
      /*
        The last few exchanges go with the question, so a follow-up can refer back to them.
        Without this "అందులో ఎక్కువ ఎవరు" — who among them owes most — reached the model
        as a question about nobody, and was answered accordingly.
      */
      const history = turns
        .filter((turn) => turn.result && !turn.result.error)
        .slice(-3)
        .map((turn) => ({ question: turn.question, answer: turn.result!.answer }));

      const result = await askLedger({ data: { question: asked, history } });
      setTurns((prev) => [...prev, { question: asked, result }]);
      /*
        Headline first, then the names.

        The list used to be left on screen unread, on the reasoning that eighty names cannot
        be followed by ear. But the person this is for cannot read the screen, so a count
        told them nothing — the names are the answer. Short results read themselves; longer
        ones wait for the button, because starting eighty names unasked is its own problem.
      */
      if (result.answer && !result.error) {
        if (result.lines.length && result.lines.length <= AUTO_READ_LIMIT) {
          speakList([result.answer, ...result.lines]);
        } else {
          speakText(result.answer);
        }
      }
    } catch (err) {
      setTurns((prev) => [...prev, {
        question: asked, result: null, failed: userFacingError(err, t('errors.generic')),
      }]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <ScrollPage>
      <div className="mx-auto flex h-full max-w-2xl flex-col">
        <div className="flex-1 space-y-4 pb-4">
          {turns.length === 0 && !asking && (
            <div className="pt-6">
              <p className="mb-3 text-sm text-slate-400">{t('ask.hint')}</p>
              <div className="space-y-2">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => ask(example)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-left text-[15px] text-slate-600 transition-colors hover:border-brand/40 hover:bg-primary/5"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((turn, i) => (
            <TurnBlock
              key={i}
              turn={turn}
              canSpeak={canSpeak}
              reading={reading}
              onReadList={() => {
                const result = turn.result;
                if (!result) return;
                if (reading) cancel();
                else speakList([result.answer, ...result.lines]);
              }}
              onReplay={() => turn.result?.answer && speakText(turn.result.answer)}
            />
          ))}

          {/* Hands-free. One press starts a conversation rather than a dictation, and the
              question goes on its own when you stop talking. */}
          {canSpeak && (
            <div className="flex justify-center py-4">
              <VoiceAgent onAsk={ask} busy={asking} speaking={reading} onInterrupt={cancel} />
            </div>
          )}

          {asking && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Spinner size="sm" />
              {t('ask.thinking')}
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Sits at the bottom like a chat composer, above the bottom bar on mobile. */}
        <div
          className="sticky bottom-0 -mx-1 bg-card/95 px-1 pb-2 pt-2 backdrop-blur"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
        >
          <form
            onSubmit={(e) => { e.preventDefault(); ask(question); }}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-card px-2 py-1.5"
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('ask.placeholder')}
              enterKeyHint="send"
              lang="te"
              className="min-h-11 flex-1 bg-transparent px-1 text-[16px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {/*
              No microphone here.

              There was one, and it was the search box's — the dialog that listens, then
              offers five readings so the right spelling of a name can be picked. Two
              microphones on one screen doing different things is bad enough; the one that
              made you choose a spelling before the question was even sent is the flow this
              page exists to get away from. Talking to it is the big button above.
            */}
            <button
              type="submit"
              disabled={!question.trim() || asking}
              aria-label={t('ask.send')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-opacity disabled:opacity-30"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </ScrollPage>
  );
}

function TurnBlock({ turn, canSpeak, reading, onReplay, onReadList }: {
  turn: Turn;
  canSpeak: boolean;
  reading: boolean;
  onReplay: () => void;
  onReadList: () => void;
}) {
  const { t } = useTranslation();
  const [showSql, setShowSql] = useState(false);
  const { result } = turn;

  return (
    <div className="space-y-2">
      <p className="ml-auto w-fit max-w-[85%] rounded-2xl bg-primary px-3.5 py-2 text-[15px] text-on-primary">
        {turn.question}
      </p>

      {turn.failed && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{turn.failed}</p>
      )}

      {result?.error && (
        <div className="space-y-1.5">
          <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <p>{t(result.error)}</p>
            {/* The specific reason, when there is one worth reading — a refusal or a
                Postgres complaint. English, because that is what it is. */}
            {result.errorDetail && (
              <p className="mt-0.5 text-xs text-amber-700/80">{result.errorDetail}</p>
            )}
          </div>
          {result.sql && <SqlBlock sql={result.sql} />}
        </div>
      )}

      {result && !result.error && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <p className="flex-1 text-[16px] font-medium text-slate-900">{result.answer}</p>
            {canSpeak && (
              <button
                type="button"
                onClick={onReplay}
                aria-label={t('collections.readAloud')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a5 5 0 010 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Reads the names out, and stops them. The stop is the more important half:
              a list of eighty started by accident needs a way out that is not the back
              button. */}
          {canSpeak && result.lines.length > 0 && (
            <button
              type="button"
              onClick={onReadList}
              className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              {reading ? (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                  {t('ask.stopReading')}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
                  </svg>
                  {t('ask.readNames', { count: result.lines.length })}
                </>
              )}
            </button>
          )}

          {result.rows.length > 0 && <ResultTable columns={result.columns} rows={result.rows} />}

          <button
            type="button"
            onClick={() => setShowSql((v) => !v)}
            className="text-xs text-slate-400 underline-offset-2 hover:underline"
          >
            {showSql ? t('ask.hideQuery') : t('ask.showQuery')}
          </button>
          {showSql && result.sql && <SqlBlock sql={result.sql} />}
        </div>
      )}
    </div>
  );
}

/** Scrolls inside itself: a wide result must not make the page scroll sideways. */
function ResultTable({ columns, rows }: { columns: string[]; rows: AskResult['rows'] }) {
  return (
    <div className="overflow-x-auto overscroll-x-contain rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-slate-500">
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-3 py-2 text-xs font-medium">
                {c.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c} className="whitespace-nowrap px-3 py-2 tabular text-slate-700">
                  {row[c] === null ? '—' : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SqlBlock({ sql }: { sql: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-slate-900 px-3 py-2 text-[11px] leading-relaxed text-slate-200">
      {sql}
    </pre>
  );
}
