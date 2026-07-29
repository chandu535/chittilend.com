import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BorrowerForm } from '@/components/borrowers/BorrowerForm';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { fileToBase64 } from '@/lib/fileToBase64';
import { FileUpload } from '@/components/ui/FileUpload';
import { createBorrower, updateBorrower } from '@/server/functions/borrowers';
import { uploadBorrowerPhoto } from '@/server/functions/upload';
import { toast } from '@/components/ui/Toast';
import { toBorrowerPayload, type BorrowerFormData } from '@/lib/borrowerPayload';

export interface CreatedBorrower {
  id: string;
  name: string;
  nameTelugu: string | null;
  mobile: string;
  area: string | null;
}

interface BorrowerCreateFlowProps {
  onCreated: (borrower: CreatedBorrower) => void | Promise<void>;
  /** Rendered beside Save on the photo step — a Back out of the whole flow, say. */
  secondaryAction?: React.ReactNode;
  saveLabel?: string;
}

/**
 * Adding a borrower: details, then photos, then the record.
 *
 * One component rather than two, because this runs both from the Borrowers page and from
 * inside the new-loan wizard. The wizard used to carry its own cut-down version asking
 * only for a name and a mobile, so a borrower added while writing a loan quietly lost
 * their photo, Aadhaar, location and surety — the same person, recorded differently
 * depending on which screen they were added from.
 *
 * The borrower is created once and updated on the way back, so stepping between the two
 * halves never leaves a duplicate behind. Photos need an id to attach to, so they upload
 * after the record exists; a failed upload leaves the borrower in place and says so,
 * rather than losing the details that were just typed.
 */
export function BorrowerCreateFlow({ onCreated, secondaryAction, saveLabel }: BorrowerCreateFlowProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<BorrowerFormData | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [aadhaarPhoto, setAadhaarPhoto] = useState<File | null>(null);

  // Where the photo was taken. Held until save so that opening the camera, then thinking
  // better of it, does not stamp a location onto the borrower.
  const [photoLocation, setPhotoLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Set on the first save. A second save updates that borrower instead of making another,
  // which is what happens when a photo upload fails and the save is retried.
  const [borrowerId, setBorrowerId] = useState<string | null>(null);

  const uploadPhoto = async (file: File, borrowerId: string, docType: 'profile' | 'aadhaar') => {
    const fileData = await fileToBase64(file);
    await uploadBorrowerPhoto({ data: { borrowerId, docType, fileData, contentType: file.type } });
  };

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      const payload = toBorrowerPayload(formData, photoLocation);

      const borrower = borrowerId
        ? await updateBorrower({ data: { id: borrowerId, ...payload } })
        : await createBorrower({ data: payload });
      setBorrowerId(borrower.id);

      const uploads: Promise<void>[] = [];
      if (profilePhoto) uploads.push(uploadPhoto(profilePhoto, borrower.id, 'profile'));
      if (aadhaarPhoto) uploads.push(uploadPhoto(aadhaarPhoto, borrower.id, 'aadhaar'));
      if (uploads.length) await Promise.all(uploads);

      await onCreated({
        id: borrower.id,
        name: borrower.name,
        nameTelugu: borrower.nameTelugu,
        mobile: borrower.mobile,
        area: borrower.area,
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <StepPill number={1} label={t('borrowers.stepDetails')} active={step === 1} completed={step > 1} onClick={() => setStep(1)} />
        <StepPill number={2} label={t('borrowers.stepPhotos')} active={step === 2} completed={false} />
      </div>

      {step === 1 && (
        <Card>
          <div className="mb-4">
            <CardTitle>{t('borrowers.stepDetails')}</CardTitle>
            <CardDescription>{t('borrowers.stepDetailsDesc')}</CardDescription>
          </div>
          <BorrowerForm
            initialData={formData ?? undefined}
            submitLabel={t('common.next')}
            onSubmit={async (data) => { setFormData(data as BorrowerFormData); setStep(2); }}
          />
          {secondaryAction && <div className="mt-3">{secondaryAction}</div>}
        </Card>
      )}

      {step === 2 && (
        <>
          <Card>
            <div className="mb-4">
              <CardTitle>{t('borrowers.profilePhoto')}</CardTitle>
              <CardDescription>{t('borrowers.stepPhotosDesc')}</CardDescription>
            </div>

            <CameraCapture
              label={t('borrowers.capturePhoto')}
              onCapture={(file) => setProfilePhoto(file)}
              onLocation={(lat, lng) => setPhotoLocation({ lat, lng })}
            />

            {/* Taking the photo at the borrower's place is the moment their location is
                known, so it is recorded then. Optional throughout: a refused permission
                is silent, and the address field still takes a pasted map link. */}
            {photoLocation && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('borrowers.locationCaptured')}
                <button
                  type="button"
                  onClick={() => setPhotoLocation(null)}
                  className="ml-1 font-medium text-slate-400 underline hover:text-slate-600"
                >
                  {t('common.cancel')}
                </button>
              </p>
            )}

            <div className="mt-3 pt-3 border-t border-slate-100">
              <FileUpload
                label={t('borrowers.uploadPhoto')}
                onFileSelect={(file) => { if (file) setProfilePhoto(file); }}
              />
            </div>
          </Card>

          <Card>
            <CardTitle>{t('borrowers.aadhaarPhoto')}</CardTitle>
            <div className="mt-3">
              {/* No location here. Where a card was photographed says nothing about where
                  its holder lives, and the profile photo has already answered that. */}
              <CameraCapture
                label={t('borrowers.captureAadhaar')}
                onCapture={(file) => setAadhaarPhoto(file)}
              />
            </div>

            <div className="mt-3 border-t border-slate-100 pt-3">
              <FileUpload
                label={t('borrowers.aadhaarPhoto')}
                onFileSelect={(file) => { if (file) setAadhaarPhoto(file); }}
              />
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setStep(1)} disabled={saving}>
              {t('common.back')}
            </Button>
            <Button className="flex-1" onClick={handleSave} loading={saving}>
              {saveLabel ?? t('common.save')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function StepPill({ number, label, active, completed, onClick }: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
  onClick?: () => void;
}) {
  const clickable = completed && onClick;

  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      aria-current={active ? 'step' : undefined}
      className={`flex flex-1 items-center gap-2.5 rounded-xl px-4 py-3 transition-colors ${
        active ? 'border-2 border-brand bg-primary/10'
          : completed ? 'cursor-pointer border-2 border-emerald-200 bg-emerald-50'
            : 'cursor-default border-2 border-slate-200 bg-slate-50'
      }`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        active ? 'bg-primary text-on-primary' : completed ? 'bg-success text-on-status' : 'bg-slate-200 text-slate-500'
      }`}>
        {completed ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : number}
      </span>
      <span className={`text-sm font-medium ${active ? 'text-brand' : completed ? 'text-emerald-700' : 'text-slate-400'}`}>
        {label}
      </span>
    </button>
  );
}
