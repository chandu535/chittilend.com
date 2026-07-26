import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ScrollPage } from '@/components/layout/PageLayout';
import { useState } from 'react';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BorrowerForm } from '@/components/borrowers/BorrowerForm';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { FileUpload } from '@/components/ui/FileUpload';
import { createBorrower } from '@/server/functions/borrowers';
import { uploadBorrowerPhoto } from '@/server/functions/upload';
import { toast } from '@/components/ui/Toast';

export const Route = createFileRoute('/_authenticated/borrowers/new')({
  component: NewBorrowerPage,
});

interface BorrowerFormData {
  name: string;
  mobile: string;
  area: string;
  address: string;
  locationUrl: string;
  locationLat: number | null;
  locationLng: number | null;
  suretyType: 'owner' | 'existing_borrower';
  suretyReferenceId: string;
}

function NewBorrowerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BorrowerFormData | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [aadhaarPhoto, setAadhaarPhoto] = useState<File | null>(null);

  const handleFormNext = async (data: BorrowerFormData) => {
    setFormData(data);
    setStep(2);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadPhoto = async (file: File, borrowerId: string, docType: 'profile' | 'aadhaar') => {
    const fileData = await fileToBase64(file);
    await uploadBorrowerPhoto({ data: { borrowerId, docType, fileData, contentType: file.type } });
  };

  const handleSubmit = async () => {
    if (!formData) return;
    setLoading(true);
    try {
      const { locationUrl: _locationUrl, ...borrowerData } = formData;
      const borrower = await createBorrower({ data: borrowerData });

      // Upload any selected photos now that we have a borrower ID
      const uploads: Promise<void>[] = [];
      if (profilePhoto) uploads.push(uploadPhoto(profilePhoto, borrower.id, 'profile'));
      if (aadhaarPhoto) uploads.push(uploadPhoto(aadhaarPhoto, borrower.id, 'aadhaar'));
      if (uploads.length > 0) await Promise.all(uploads);

      toast(t('borrowers.createSuccess'), 'success');
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
    <ScrollPage>
      <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <h2 className="text-2xl font-bold text-slate-900">{t('borrowers.newBorrower')}</h2>

      {/* Step Indicator */}
      <div className="flex gap-3">
        <StepPill
          number={1}
          label={t('borrowers.stepDetails')}
          active={step === 1}
          completed={step > 1}
          onClick={() => step > 1 && setStep(1)}
        />
        <StepPill
          number={2}
          label={t('borrowers.stepPhotos')}
          active={step === 2}
          completed={false}
        />
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <Card>
          <div className="mb-4">
            <CardTitle>{t('borrowers.stepDetails')}</CardTitle>
            <CardDescription>{t('borrowers.stepDetailsDesc')}</CardDescription>
          </div>
          <BorrowerForm
            initialData={formData ?? undefined}
            onSubmit={handleFormNext}
            submitLabel={t('common.next')}
          />
        </Card>
      )}

      {/* Step 2: Photos */}
      {step === 2 && (
        <>
          <Card>
            <div className="mb-4">
              <CardTitle>{t('borrowers.profilePhoto')}</CardTitle>
              <CardDescription>{t('borrowers.stepPhotosDesc')}</CardDescription>
            </div>

            {/* Camera — full-width and prominent */}
            <CameraCapture
              onCapture={(file) => setProfilePhoto(file)}
            />

            {/* File upload fallback */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <FileUpload
                label={t('borrowers.uploadPhoto')}
                onFileSelect={(file) => {
                  if (file) setProfilePhoto(file);
                }}
              />
            </div>
          </Card>

          <Card>
            <CardTitle>{t('borrowers.aadhaarPhoto')}</CardTitle>
            <div className="mt-3">
              <FileUpload
                label={t('borrowers.aadhaarPhoto')}
                onFileSelect={(file) => {
                  if (file) setAadhaarPhoto(file);
                }}
              />
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>
              {t('common.back')}
            </Button>
            <Button className="flex-1" onClick={handleSubmit} loading={loading}>
              {t('common.save')}
            </Button>
          </div>
        </>
      )}
      </div>
    </ScrollPage>
  );
}

function StepPill({
  number,
  label,
  active,
  completed,
  onClick,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
  onClick?: () => void;
}) {
  const isClickable = completed && onClick;

  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      className={`
        flex-1 flex items-center gap-2.5 rounded-xl px-4 py-3 transition-colors
        ${active
          ? 'bg-primary/10 border-2 border-primary'
          : completed
            ? 'bg-emerald-50 border-2 border-emerald-200 cursor-pointer'
            : 'bg-slate-50 border-2 border-slate-200'
        }
        ${!isClickable && !active ? 'cursor-default' : ''}
      `}
      aria-current={active ? 'step' : undefined}
    >
      <span
        className={`
          flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold shrink-0
          ${active
            ? 'bg-primary text-white'
            : completed
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-300 text-white'
          }
        `}
      >
        {completed ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          number
        )}
      </span>
      <span
        className={`text-sm font-medium ${
          active ? 'text-primary' : completed ? 'text-emerald-700' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
