import { useTranslation } from 'react-i18next';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import type { LoanCalculation } from '@/lib/calculations';

interface AutoCalcPreviewProps {
  calc: LoanCalculation | null;
}

export function AutoCalcPreview({ calc }: AutoCalcPreviewProps) {
  const { t } = useTranslation();

  if (!calc) return null;

  const rows = [
    { label: t('loans.primaryAmount'), value: calc.primaryAmount },
    { label: t('loans.serviceCharge'), value: calc.serviceChargeAmount, muted: true },
    { label: t('loans.amountReceived'), value: calc.amountUserReceives },
    { label: t('loans.totalRepayment'), value: calc.totalRepayment, bold: true },
    { label: t('loans.installment'), value: calc.installmentAmount },
    { label: t('loans.profit'), value: calc.profitAmount, success: true },
  ];

  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between text-sm">
          <span className={row.muted ? 'text-slate-400' : 'text-slate-600'}>
            {row.label}
          </span>
          <CurrencyDisplay
            amount={row.value}
            className={
              row.bold
                ? 'font-bold text-slate-900'
                : row.success
                  ? 'font-semibold text-emerald-600'
                  : row.muted
                    ? 'text-slate-400'
                    : 'font-medium text-slate-900'
            }
          />
        </div>
      ))}
    </div>
  );
}
