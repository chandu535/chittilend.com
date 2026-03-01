import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_authenticated/analytics')({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">{t('analytics.title')}</h2>
      <p className="mt-2 text-slate-500">Coming in Phase 5</p>
    </div>
  );
}
