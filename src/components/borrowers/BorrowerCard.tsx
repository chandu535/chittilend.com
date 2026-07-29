import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { formatPhone } from '@/lib/formatters';
import { useLocalizedName } from '@/components/shared/NameDisplay';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { ContactActions } from '@/components/shared/ContactActions';

interface BorrowerCardProps {
  id: string;
  name: string;
  nameTelugu?: string | null;
  mobile: string;
  area: string | null;
  photoUrl?: string | null;
  loanCount?: number;
}

export function BorrowerCard({ id, name, nameTelugu, mobile, area, photoUrl, loanCount }: BorrowerCardProps) {
  const { t } = useTranslation();
  const displayName = useLocalizedName(name, nameTelugu);

  return (
    // The card is a container rather than a link: an anchor may not contain the call and
    // WhatsApp anchors, so only the part that navigates is wrapped.
    <div className="rounded-xl border border-slate-200 bg-card p-4 transition-shadow hover:shadow-md">
      <Link
        to="/borrowers/$borrowerId"
        params={{ borrowerId: id }}
        className="block"
      >
      <div className="flex items-center gap-3">
        <BorrowerAvatar name={name} nameTelugu={nameTelugu} photoUrl={photoUrl} size="md" />
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

      <ContactActions mobile={mobile} name={displayName} className="mt-3" />
    </div>
  );
}
