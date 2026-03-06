import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { searchBorrowers } from '@/server/functions/borrowers';

interface BorrowerFormData {
  name: string;
  mobile: string;
  area: string;
  address: string;
  suretyType: 'owner' | 'existing_borrower';
  suretyReferenceId: string;
}

interface BorrowerFormProps {
  initialData?: Partial<BorrowerFormData>;
  onSubmit: (data: BorrowerFormData) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

export function BorrowerForm({ initialData, onSubmit, loading, submitLabel }: BorrowerFormProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<BorrowerFormData>({
    name: initialData?.name || '',
    mobile: initialData?.mobile || '',
    area: initialData?.area || '',
    address: initialData?.address || '',
    suretyType: initialData?.suretyType || 'owner',
    suretyReferenceId: initialData?.suretyReferenceId || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suretyResults, setSuretyResults] = useState<Array<{ id: string; name: string; mobile: string }>>([]);
  const [suretySearch, setSuretySearch] = useState('');

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!data.name || data.name.trim().length < 2) {
      errs.name = t('common.required');
    }

    if (!data.mobile || !/^[0-9]{10}$/.test(data.mobile)) {
      errs.mobile = t('borrowers.mobileHint');
    }

    if (data.suretyType === 'existing_borrower' && !data.suretyReferenceId) {
      errs.suretyReferenceId = t('common.required');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(data);
  };

  const handleSuretySearch = async (query: string) => {
    setSuretySearch(query);
    if (query.length < 1) {
      setSuretyResults([]);
      return;
    }
    try {
      const results = await searchBorrowers({ data: { query } });
      setSuretyResults(results);
    } catch {
      setSuretyResults([]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t('borrowers.name')}
        value={data.name}
        onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
        error={errors.name}
        required
      />

      <Input
        label={t('borrowers.mobile')}
        value={data.mobile}
        onChange={(e) => setData((d) => ({ ...d, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
        error={errors.mobile}
        hint={t('borrowers.mobileHint')}
        inputMode="numeric"
        lang="en"
        required
      />

      <Input
        label={t('borrowers.area')}
        value={data.area}
        onChange={(e) => setData((d) => ({ ...d, area: e.target.value }))}
      />

      <Input
        label={t('borrowers.address')}
        value={data.address}
        onChange={(e) => setData((d) => ({ ...d, address: e.target.value }))}
      />

      <Select
        label={t('borrowers.surety')}
        value={data.suretyType}
        onChange={(e) => {
          setData((d) => ({
            ...d,
            suretyType: e.target.value as 'owner' | 'existing_borrower',
            suretyReferenceId: '',
          }));
          setSuretyResults([]);
          setSuretySearch('');
        }}
        options={[
          { value: 'owner', label: t('borrowers.suretyOwner') },
          { value: 'existing_borrower', label: t('borrowers.suretyExisting') },
        ]}
      />

      {data.suretyType === 'existing_borrower' && (
        <div>
          <Input
            label={t('borrowers.suretyReference')}
            value={suretySearch}
            onChange={(e) => handleSuretySearch(e.target.value)}
            error={errors.suretyReferenceId}
            placeholder={t('common.search')}
          />
          {suretyResults.length > 0 && (
            <ul className="mt-1 rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 max-h-40 overflow-y-auto">
              {suretyResults.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 min-h-[44px]"
                    onClick={() => {
                      setData((d) => ({ ...d, suretyReferenceId: b.id }));
                      setSuretySearch(b.name);
                      setSuretyResults([]);
                    }}
                  >
                    <NameDisplay name={b.name} /> — {b.mobile}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" loading={loading}>
        {submitLabel || t('common.save')}
      </Button>
    </form>
  );
}
