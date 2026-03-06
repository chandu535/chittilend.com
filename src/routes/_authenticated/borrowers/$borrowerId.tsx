import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { getBorrowerById, updateBorrower, deleteBorrower } from '@/server/functions/borrowers';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { MagicLinkGenerator } from '@/components/borrowers/MagicLinkGenerator';
import { BorrowerForm } from '@/components/borrowers/BorrowerForm';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { useLocalizedName } from '@/components/shared/NameDisplay';
import { formatPhone } from '@/lib/formatters';
import { toast } from '@/components/ui/Toast';

export const Route = createFileRoute('/_authenticated/borrowers/$borrowerId')({
  component: BorrowerDetailPage,
});

function BorrowerDetailPage() {
  const { borrowerId } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [borrower, setBorrower] = useState<Awaited<ReturnType<typeof getBorrowerById>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const displayName = useLocalizedName(borrower?.name ?? '');

  const fetchBorrower = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBorrowerById({ data: { id: borrowerId } });
      setBorrower(data);
    } catch {
      // error boundary
    } finally {
      setLoading(false);
    }
  }, [borrowerId]);

  useEffect(() => {
    fetchBorrower();
  }, [fetchBorrower]);

  const handleUpdate = async (formData: {
    name: string;
    mobile: string;
    area: string;
    address: string;
    suretyType: 'owner' | 'existing_borrower';
    suretyReferenceId: string;
  }) => {
    setSaving(true);
    try {
      await updateBorrower({ data: { id: borrowerId, ...formData } });
      setEditOpen(false);
      toast(t('borrowers.updateSuccess'), 'success');
      await fetchBorrower();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBorrower({ data: { id: borrowerId } });
      toast(t('borrowers.deleteSuccess'), 'success');
      navigate({ to: '/borrowers' });
    } catch (err) {
      const message = err instanceof Error && err.message.includes('BORROWER_HAS_ACTIVE_LOANS')
        ? t('borrowers.hasActiveLoans')
        : err instanceof Error ? err.message : t('errors.generic');
      toast(message, 'error');
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!borrower) {
    return <p className="text-center text-slate-500 py-12">{t('errors.notFound')}</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/borrowers" className="text-slate-400 hover:text-slate-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 flex-1">{displayName}</h2>
        <button
          onClick={() => setEditOpen(true)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={t('borrowers.editBorrower')}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={t('borrowers.deleteBorrower')}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-lg font-semibold text-slate-900">{displayName}</p>
            <p className="text-sm text-slate-600">{formatPhone(borrower.mobile)}</p>
            {borrower.area && (
              <p className="text-sm text-slate-500">{borrower.area}</p>
            )}
            {borrower.address && (
              <p className="text-sm text-slate-400">{borrower.address}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Loans */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>{t('loans.title')}</CardTitle>
          <Link to="/loans/new">
            <Button size="sm">{t('loans.newLoan')}</Button>
          </Link>
        </div>

        {borrower.loans.length === 0 ? (
          <p className="text-sm text-slate-400">{t('loans.noLoans')}</p>
        ) : (
          <div className="space-y-2">
            {borrower.loans.map((loan) => (
              <Link
                key={loan.id}
                to="/loans/$loanId"
                params={{ loanId: loan.id }}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <CurrencyDisplay
                    amount={parseFloat(loan.primaryAmount)}
                    className="font-semibold text-slate-900"
                  />
                  <p className="text-xs text-slate-400">{loan.dateGiven}</p>
                </div>
                <Badge status={loan.status}>{loan.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Magic Link */}
      <Card>
        <MagicLinkGenerator
          borrowerId={borrower.id}
          portalToken={borrower.portalToken}
        />
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={t('borrowers.editBorrower')}>
        <BorrowerForm
          initialData={{
            name: borrower.name,
            mobile: borrower.mobile,
            area: borrower.area ?? '',
            address: borrower.address ?? '',
            suretyType: (borrower.suretyType as 'owner' | 'existing_borrower') ?? 'owner',
            suretyReferenceId: borrower.suretyReferenceId ?? '',
          }}
          onSubmit={handleUpdate}
          loading={saving}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title={t('borrowers.deleteBorrower')} size="sm">
        <p className="text-sm text-slate-600 mb-6">{t('borrowers.confirmDelete')}</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setDeleteOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete} loading={deleting}>
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
