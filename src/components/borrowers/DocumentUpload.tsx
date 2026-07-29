import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUpload } from '@/components/ui/FileUpload';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { fileToBase64 } from '@/lib/fileToBase64';
import { toast } from '@/components/ui/Toast';
import { uploadBorrowerPhoto } from '@/server/functions/upload';

interface DocumentUploadProps {
  borrowerId?: string;
  onProfilePhoto: (file: File | null) => void;
  onAadhaarPhoto: (file: File | null) => void;
  onLocation?: (lat: number, lng: number) => void;
}

export function DocumentUpload({ borrowerId, onProfilePhoto, onAadhaarPhoto, onLocation }: DocumentUploadProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState<'profile' | 'aadhaar' | null>(null);

  const handleUpload = async (file: File, docType: 'profile' | 'aadhaar') => {
    if (!borrowerId) {
      if (docType === 'profile') onProfilePhoto(file);
      else onAadhaarPhoto(file);
      return;
    }

    setUploading(docType);
    try {
      const fileData = await fileToBase64(file);
      await uploadBorrowerPhoto({ data: { borrowerId, docType, fileData, contentType: file.type } });
      toast(t('common.save'), 'success');
      if (docType === 'profile') onProfilePhoto(file);
      else onAadhaarPhoto(file);
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Profile Photo — with camera option */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('borrowers.profilePhoto')}
        </label>
        {/* With a borrowerId the shot is uploaded here and the page refetches, so the
            stored photo is what should appear — holding a local preview with a Retake
            under it would show the same picture twice. Without one the parent is still
            holding the file unsaved, and the preview is the only proof it took. */}
        <CameraCapture
          onCapture={(file) => handleUpload(file, 'profile')}
          onLocation={onLocation}
          keepPreview={!borrowerId}
        />
        <div className="mt-2">
          <FileUpload
            label={t('borrowers.uploadPhoto')}
            onFileSelect={(file) => {
              if (file) handleUpload(file, 'profile');
              else onProfilePhoto(null);
            }}
            loading={uploading === 'profile'}
          />
        </div>
      </div>

      {/* Aadhaar — the same camera-then-gallery pair as the photo above. The card is in
          hand at the doorstep, so photographing it is the usual way in; picking a file
          only matters for one that was shot earlier. */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('borrowers.aadhaarPhoto')}
        </label>
        {/* No location here. Where a card was photographed says nothing about where its
            holder lives, and the profile photo has already answered that. */}
        <CameraCapture
          label={t('borrowers.captureAadhaar')}
          onCapture={(file) => handleUpload(file, 'aadhaar')}
          keepPreview={!borrowerId}
        />
        <div className="mt-2">
          <FileUpload
            label={t('borrowers.uploadPhoto')}
            onFileSelect={(file) => {
              if (file) handleUpload(file, 'aadhaar');
              else onAadhaarPhoto(null);
            }}
            loading={uploading === 'aadhaar'}
          />
        </div>
      </div>
    </div>
  );
}
