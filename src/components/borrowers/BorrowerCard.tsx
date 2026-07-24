import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { formatPhone } from '@/lib/formatters';
import { useLocalizedName } from '@/components/shared/NameDisplay';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';

interface BorrowerCardProps {
  id: string;
  name: string;
  mobile: string;
  area: string | null;
  photoUrl?: string | null;
  loanCount?: number;
}

export function BorrowerCard({ id, name, mobile, area, photoUrl, loanCount }: BorrowerCardProps) {
  const { t } = useTranslation();
  const displayName = useLocalizedName(name);

  return (
    <Link
      to="/borrowers/$borrowerId"
      params={{ borrowerId: id }}
      className="block rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <BorrowerAvatar name={name} photoUrl={photoUrl} size="md" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900 truncate">{displayName}</p>
          <p className="text-sm text-slate-500">{formatPhone(mobile)}</p>
        </div>
        {area && (
          <span className="text-xs text-slate-400 bg-slate-50 rounded-full px-2 py-0.5 shrink-0">
            {area}
          </span>
        )}
      </div>
      {loanCount !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          {t('borrowers.activeLoans')}: {loanCount}
        </div>
      )}
    </Link>
  );
}
