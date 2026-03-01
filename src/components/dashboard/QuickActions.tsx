import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/Button';

export function QuickActions() {
  const { t } = useTranslation();

  return (
    <div className="flex gap-3">
      <Link to="/loans/new" className="flex-1">
        <Button className="w-full">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('loans.newLoan')}
        </Button>
      </Link>
      <Link to="/payments" className="flex-1">
        <Button variant="secondary" className="w-full">
          {t('payments.markPaid')}
        </Button>
      </Link>
    </div>
  );
}
