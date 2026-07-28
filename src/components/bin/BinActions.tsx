import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { invalidateListCaches } from '@/lib/requestCache';
import { binReasonKey, decodeRefusal, type Decision } from '@/lib/binRules';
import {
  purgeBorrower,
  purgeLoan,
  restoreBorrower,
  restoreLoan,
} from '@/server/functions/bin';

interface BinActionsProps {
  kind: 'loan' | 'borrower';
  id: string;
  /** How the row is named in the confirmations — "#142" or the borrower's name. */
  label: string;
  /** Whether restoring is possible, and whether it brings a borrower back too. */
  restore: Decision;
  purge: Decision;
  /** Named when restoring this loan also restores its borrower. */
  cascadeName?: string;
  onDone: () => void | Promise<void>;
  canPurge: boolean;
}

/**
 * Restore and Delete forever, for a row in the Bin.
 *
 * Both tabs use this, because the two actions behave identically whatever the row is and
 * the only differences — which server function, what the confirmation says — are worth
 * passing in rather than duplicating.
 *
 * A refused action is a disabled button carrying its reason, not a button that fails when
 * pressed. The reasons come from the same rules the server enforces, judged on facts the
 * row already carries, so the two cannot disagree about what is possible.
 */
export function BinActions({
  kind, id, label, restore, purge, cascadeName, onDone, canPurge,
}: BinActionsProps) {
  const { t } = useTranslation();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [purging, setPurging] = useState(false);

  /** Turns a thrown sentinel back into the sentence that explains it. */
  const report = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const refusal = decodeRefusal(message);
    toast(
      refusal ? t(binReasonKey(refusal.reason), refusal.detail) : t('errors.generic'),
      'error',
    );
  };

  const run = async (
    action: () => Promise<unknown>,
    setBusy: (busy: boolean) => void,
    close: () => void,
    success: string,
  ) => {
    setBusy(true);
    try {
      await action();
      // The row moves between three lists at once, and the two the user is not looking
      // at are the ones they will navigate to next.
      invalidateListCaches();
      toast(success, 'success');
      close();
      await onDone();
    } catch (error) {
      report(error);
      close();
    } finally {
      setBusy(false);
    }
  };

  const reasonFor = (decision: Decision) =>
    decision.allowed ? undefined : t(binReasonKey(decision.reason), decision.detail);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRestoreOpen(true)}
          disabled={!restore.allowed || restoring || purging}
          title={reasonFor(restore)}
        >
          {t('bin.restore')}
        </Button>
        {canPurge && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setPurgeOpen(true)}
            disabled={!purge.allowed || restoring || purging}
            title={reasonFor(purge)}
          >
            {t('bin.deleteForever')}
          </Button>
        )}
      </div>

      <Modal
        isOpen={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        title={t('bin.restore')}
        size="sm"
      >
        <p className="text-sm text-slate-600">{t('bin.confirmRestore', { name: label })}</p>
        {/* Stated before it happens. Someone restoring a loan has not necessarily
            realised a borrower comes back with it. */}
        {restore.allowed && restore.alsoRestoresBorrower && cascadeName && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t('bin.restoreAlsoBorrower', { name: cascadeName })}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setRestoreOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            className="flex-1"
            loading={restoring}
            onClick={() => run(
              () => (kind === 'loan'
                ? restoreLoan({ data: { id } })
                : restoreBorrower({ data: { id } })),
              setRestoring,
              () => setRestoreOpen(false),
              t('bin.restored'),
            )}
          >
            {t('bin.restore')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={purgeOpen}
        onClose={() => setPurgeOpen(false)}
        title={t('bin.deleteForever')}
        size="sm"
      >
        <p className="text-sm text-slate-600">{t('bin.confirmPurge', { name: label })}</p>
        <p className="mt-2 text-sm font-medium text-red-600">{t('bin.purgeIrreversible')}</p>
        {/* The Aadhaar scan is about to be destroyed, and the money record is about to
            survive. Both deserve saying out loud. */}
        {kind === 'borrower' && (
          <p className="mt-2 text-sm text-slate-500">{t('bin.purgePhotos')}</p>
        )}
        {kind === 'loan' && (
          <p className="mt-2 text-sm text-slate-500">{t('bin.purgeKeepsMoney')}</p>
        )}
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setPurgeOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={purging}
            onClick={() => run(
              () => (kind === 'loan'
                ? purgeLoan({ data: { id } })
                : purgeBorrower({ data: { id } })),
              setPurging,
              () => setPurgeOpen(false),
              t('bin.purged'),
            )}
          >
            {t('bin.deleteForever')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
