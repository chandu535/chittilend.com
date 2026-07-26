import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { generateNewMagicLink } from '@/server/functions/borrowers';

interface MagicLinkGeneratorProps {
  borrowerId: string;
  portalToken: string;
}

export function MagicLinkGenerator({ borrowerId, portalToken: initialToken }: MagicLinkGeneratorProps) {
  const { t } = useTranslation();
  const [token, setToken] = useState(initialToken);
  const [regenerating, setRegenerating] = useState(false);

  const portalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/portal/${token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      toast(t('borrowers.linkCopied'), 'success');
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = portalUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast(t('borrowers.linkCopied'), 'success');
    }
  };

  const handleRegenerate = async () => {
    if (!confirm(t('common.confirm') + '?')) return;
    setRegenerating(true);
    try {
      const result = await generateNewMagicLink({ data: { id: borrowerId } });
      setToken(result.portalToken);
      toast(t('borrowers.magicLink') + ' updated', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        {t('borrowers.magicLink')}
      </label>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={portalUrl}
          className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 truncate min-h-[44px]"
        />
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {t('borrowers.copyLink')}
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRegenerate}
        loading={regenerating}
      >
        {t('borrowers.generateLink')}
      </Button>
    </div>
  );
}
