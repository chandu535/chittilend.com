import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { BorrowerForm } from '@/components/borrowers/BorrowerForm';
import { DocumentUpload } from '@/components/borrowers/DocumentUpload';
import { createBorrower } from '@/server/functions/borrowers';
import { toast } from '@/components/ui/Toast';

export const Route = createFileRoute('/_authenticated/borrowers/new')({
  component: NewBorrowerPage,
});

function NewBorrowerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // Store files locally for now (actual R2 upload in Phase 5)
  const [_profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [_aadhaarPhoto, setAadhaarPhoto] = useState<File | null>(null);

  const handleSubmit = async (data: {
    name: string;
    mobile: string;
    area: string;
    address: string;
    suretyType: 'owner' | 'existing_borrower';
    suretyReferenceId: string;
  }) => {
    setLoading(true);
    try {
      const borrower = await createBorrower({ data });
      toast(t('borrowers.newBorrower') + ' created', 'success');
      navigate({
        to: '/borrowers/$borrowerId',
        params: { borrowerId: borrower.id },
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">{t('borrowers.newBorrower')}</h2>

      <Card>
        <CardTitle>{t('borrowers.name')}</CardTitle>
        <BorrowerForm onSubmit={handleSubmit} loading={loading} />
      </Card>

      <Card>
        <CardTitle>{t('borrowers.aadhaarPhoto')}</CardTitle>
        <DocumentUpload
          onProfilePhoto={setProfilePhoto}
          onAadhaarPhoto={setAadhaarPhoto}
        />
      </Card>
    </div>
  );
}
