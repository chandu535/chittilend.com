import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">
        {t('dashboard.title')}
      </h2>
      <p className="mt-2 text-slate-500">
        {t('dashboard.subtitle')}
      </p>
    </div>
  );
}
