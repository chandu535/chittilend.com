import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_authenticated/borrowers/')({
  component: BorrowersPage,
});

function BorrowersPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">{t('borrowers.title')}</h2>
      <p className="mt-2 text-slate-500">Coming in Phase 4</p>
    </div>
  );
}
