import { useTranslation } from 'react-i18next';
import { FileUpload } from '@/components/ui/FileUpload';

interface DocumentUploadProps {
  onProfilePhoto: (file: File | null) => void;
  onAadhaarPhoto: (file: File | null) => void;
}

export function DocumentUpload({ onProfilePhoto, onAadhaarPhoto }: DocumentUploadProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <FileUpload
        label={t('borrowers.profilePhoto')}
        onFileSelect={onProfilePhoto}
      />
      <FileUpload
        label={t('borrowers.aadhaarPhoto')}
        onFileSelect={onAadhaarPhoto}
      />
    </div>
  );
}
