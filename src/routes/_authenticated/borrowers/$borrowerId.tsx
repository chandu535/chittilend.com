import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ScrollPage } from '@/components/layout/PageLayout';
import { useState, useEffect, useCallback } from 'react';
import { getBorrowerById, updateBorrower } from '@/server/functions/borrowers';
import { binBorrower } from '@/server/functions/bin';
import { canBinBorrower, binReasonKey, decodeRefusal } from '@/lib/binRules';
import { invalidateListCaches } from '@/lib/requestCache';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Modal } from '@/components/ui/Modal';
import { ZoomableImage } from '@/components/ui/ZoomableImage';
import { MapPinIcon, LocateIcon } from '@/components/shared/icons';
import { MagicLinkGenerator } from '@/components/borrowers/MagicLinkGenerator';
import { DocumentUpload } from '@/components/borrowers/DocumentUpload';
import { BorrowerForm } from '@/components/borrowers/BorrowerForm';
import { BorrowerPhotoCapture } from '@/components/borrowers/BorrowerPhotoCapture';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { useLocalizedName } from '@/components/shared/NameDisplay';
import { formatPhone } from '@/lib/formatters';
import { toast } from '@/components/ui/Toast';
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/lib/stores';
import { can } from '@/lib/permissions';

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
  const user = useStore(authStore, (s) => s.user);
  const canDelete = can(user, 'bin.write');
  const canWriteLoans = can(user, 'loans.create');
  const canWriteBorrowers = can(user, 'borrowers.write');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const displayName = useLocalizedName(borrower?.name ?? '', borrower?.nameTelugu);

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
    nameTelugu: string;
    mobile: string;
    area: string;
    address: string;
    locationUrl: string;
    locationLat: number | null;
    locationLng: number | null;
    suretyType: 'owner' | 'existing_borrower';
    suretyReferenceId: string;
  }) => {
    setSaving(true);
    try {
      const { locationUrl: _locationUrl, ...borrowerData } = formData;
      await updateBorrower({ data: { id: borrowerId, ...borrowerData } });
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
      await binBorrower({ data: { id: borrowerId } });
      // The borrower leaves the list and appears in the Bin — two cached pages, neither
      // of them the one being looked at.
      invalidateListCaches();
      toast(t('bin.borrowerBinned'), 'success');
      navigate({ to: '/borrowers' });
    } catch (err) {
      // Table-driven rather than matching one hardcoded string, so every refusal the
      // server can give has a sentence here.
      const raw = err instanceof Error ? err.message : String(err);
      const refusal = decodeRefusal(raw);
      toast(refusal ? t(binReasonKey(refusal.reason), refusal.detail) : t('errors.generic'), 'error');
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast(t('borrowers.locationUnavailable'), 'error');
      return;
    }
    setLocationSaving(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await updateBorrower({
            data: { id: borrowerId, locationLat: coords.latitude, locationLng: coords.longitude },
          });
          toast(t('borrowers.updateSuccess'), 'success');
          await fetchBorrower();
        } catch (err) {
          toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
        } finally {
          setLocationSaving(false);
        }
      },
      () => {
        toast(t('borrowers.locationUnavailable'), 'error');
        setLocationSaving(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (loading) {
    return (
      <PageSkeleton variant="detail" />
    );
  }

  if (!borrower) {
    return <p className="text-center text-slate-500 py-12">{t('errors.notFound')}</p>;
  }

  // getBorrowerById already loads this borrower's live loans, so their length is exactly
  // the count the rule needs — no extra query for it.
  const binDecision = canBinBorrower({
    deleted: false,
    liveLoanCount: borrower.loans.length,
    totalLoanCount: borrower.loans.length,
    mobileHolder: null,
  });
  const binRefusal = binDecision.allowed
    ? undefined
    : t(binReasonKey(binDecision.reason), binDecision.detail);

  return (
    <ScrollPage>
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
        {canDelete && (
        <button
          onClick={() => setDeleteOpen(true)}
          disabled={!binDecision.allowed}
          // The reason rides on the button rather than only appearing after a failed
          // press — a greyed icon with no explanation reads as a broken page.
          title={binDecision.allowed ? undefined : binRefusal}
          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          aria-label={t('borrowers.deleteBorrower')}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex items-start gap-4">
          <BorrowerPhotoCapture
            borrowerId={borrowerId}
            name={borrower.name}
            nameTelugu={borrower.nameTelugu}
            photoUrl={borrower.profilePhotoUrl}
            onUploaded={fetchBorrower}
            canEdit={canWriteBorrowers}
          />
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-lg font-semibold text-slate-900">{displayName}</p>
            <p className="text-sm text-slate-600">{formatPhone(borrower.mobile)}</p>
            {borrower.area && (
              <p className="text-sm text-slate-500">{borrower.area}</p>
            )}
            {borrower.address && (
              <p className="text-sm text-slate-400">{borrower.address}</p>
            )}
            {borrower.locationLat && borrower.locationLng && (
              <a
                href={`https://www.google.com/maps?q=${borrower.locationLat},${borrower.locationLng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
              >
                <MapPinIcon className="h-4 w-4" />{t('borrowers.openLocation')}
              </a>
            )}
            <button
              type="button"
              onClick={captureLocation}
              disabled={locationSaving}
              className="ml-3 inline-flex items-center gap-1 text-sm text-brand hover:underline disabled:opacity-50"
            >
              <LocateIcon className="h-4 w-4" />{t('borrowers.captureLocation')}
            </button>
          </div>
        </div>
      </Card>

      {/* Loans */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>{t('loans.title')}</CardTitle>
          {canWriteLoans && (
            <Link to="/loans/new">
              <Button size="sm">{t('loans.newLoan')}</Button>
            </Link>
          )}
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 tabular-nums">#{loan.loanNumber}</span>
                    <CurrencyDisplay
                      amount={parseFloat(loan.primaryAmount)}
                      className="font-semibold text-slate-900"
                    />
                  </div>
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

      {/* Photos */}
      <Card>
        <CardTitle className="mb-3">{t('borrowers.stepPhotos')}</CardTitle>

        {(borrower.profilePhotoUrl || borrower.aadhaarPhotoUrl) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {borrower.profilePhotoUrl && (
              <div>
                <p className="text-xs text-slate-500 mb-1">{t('borrowers.profilePhoto')}</p>
                <ZoomableImage
                  src={borrower.profilePhotoUrl}
                  alt={t('borrowers.profilePhoto')}
                  className="w-full rounded-lg object-cover aspect-square"
                />
              </div>
            )}
            {borrower.aadhaarPhotoUrl && (
              <div>
                <p className="text-xs text-slate-500 mb-1">{t('borrowers.aadhaarPhoto')}</p>
                <ZoomableImage
                  src={borrower.aadhaarPhotoUrl}
                  alt={t('borrowers.aadhaarPhoto')}
                  className="w-full rounded-lg object-cover aspect-square"
                />
              </div>
            )}
          </div>
        )}

        <DocumentUpload
          borrowerId={borrower.id}
          onProfilePhoto={() => fetchBorrower()}
          onAadhaarPhoto={() => fetchBorrower()}
        />
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={t('borrowers.editBorrower')}>
        <BorrowerForm
          initialData={{
            name: borrower.name,
            nameTelugu: borrower.nameTelugu ?? '',
            mobile: borrower.mobile,
            area: borrower.area ?? '',
            address: borrower.address ?? '',
            locationUrl: borrower.locationLat && borrower.locationLng
              ? `https://www.google.com/maps?q=${borrower.locationLat},${borrower.locationLng}`
              : '',
            locationLat: borrower.locationLat ? Number(borrower.locationLat) : null,
            locationLng: borrower.locationLng ? Number(borrower.locationLng) : null,
            suretyType: (borrower.suretyType as 'owner' | 'existing_borrower') ?? 'owner',
            suretyReferenceId: borrower.suretyReferenceId ?? '',
          }}
          onSubmit={handleUpdate}
          loading={saving}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title={t('bin.moveToBin')} size="sm">
        <p className="text-sm text-slate-600 mb-6">{t('bin.confirmBinBorrower', { name: displayName })}</p>
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
    </ScrollPage>
  );
}
