import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ScrollPage } from '@/components/layout/PageLayout';
import { BorrowerCreateFlow } from '@/components/borrowers/BorrowerCreateFlow';
import { toast } from '@/components/ui/Toast';

export const Route = createFileRoute('/_authenticated/borrowers/new')({
  component: NewBorrowerPage,
});

function NewBorrowerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <ScrollPage>
      <div className="mx-auto max-w-lg space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">{t('borrowers.newBorrower')}</h2>

        {/* The same flow the new-loan wizard runs, so a borrower ends up recorded the same
            way whichever screen they were added from. */}
        <BorrowerCreateFlow
          onCreated={(borrower) => {
            toast(t('borrowers.createSuccess'), 'success');
            navigate({ to: '/borrowers/$borrowerId', params: { borrowerId: borrower.id } });
          }}
        />
      </div>
    </ScrollPage>
  );
}
