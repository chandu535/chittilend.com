import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_authenticated/loans/')({
  component: LoansPage,
});

function LoansPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">{t('loans.title')}</h2>
      <p className="mt-2 text-slate-500">Coming in Phase 3</p>
    </div>
  );
}
