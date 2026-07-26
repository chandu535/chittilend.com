import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUpload } from '@/components/ui/FileUpload';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { toast } from '@/components/ui/Toast';
import { uploadBorrowerPhoto } from '@/server/functions/upload';

interface DocumentUploadProps {
  borrowerId?: string;
  onProfilePhoto: (file: File | null) => void;
  onAadhaarPhoto: (file: File | null) => void;
  onLocation?: (lat: number, lng: number) => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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
        <CameraCapture
          onCapture={(file) => handleUpload(file, 'profile')}
          onLocation={onLocation}
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

      {/* Aadhaar Photo */}
      <FileUpload
        label={t('borrowers.aadhaarPhoto')}
        onFileSelect={(file) => {
          if (file) handleUpload(file, 'aadhaar');
          else onAadhaarPhoto(null);
        }}
        loading={uploading === 'aadhaar'}
      />
    </div>
  );
}
