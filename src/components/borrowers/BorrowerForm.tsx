import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { searchBorrowers } from '@/server/functions/borrowers';
import { TeluguNamePreview } from './TeluguNamePreview';
import { MapPinIcon, LocateIcon } from '@/components/shared/icons';
import { toast } from '@/components/ui/Toast';
import { hasTeluguScript } from '@/lib/transliterate';
import { VoiceInput } from '@/components/ui/VoiceInput';
import { sanitiseSpokenName } from '@/lib/borrowerPayload';

interface BorrowerFormData {
  name: string;
  nameTelugu: string;
  mobile: string;
  area: string;
  address: string;
  locationUrl: string;
  locationLat: number | null;
  locationLng: number | null;
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
    nameTelugu: initialData?.nameTelugu || '',
    mobile: initialData?.mobile || '',
    area: initialData?.area || '',
    address: initialData?.address || '',
    locationUrl: initialData?.locationUrl || '',
    locationLat: initialData?.locationLat ?? null,
    locationLng: initialData?.locationLng ?? null,
    suretyType: initialData?.suretyType || 'owner',
    suretyReferenceId: initialData?.suretyReferenceId || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suretyResults, setSuretyResults] = useState<Array<{ id: string; name: string; nameTelugu: string | null; mobile: string }>>([]);
  const [suretySearch, setSuretySearch] = useState('');
  const [locating, setLocating] = useState(false);

  const setLocationFromUrl = (locationUrl: string) => {
    const match = locationUrl.match(/(?:@|[?&](?:q|query)=)?(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/);
    const locationLat = match ? Number(match[1]) : null;
    const locationLng = match ? Number(match[2]) : null;
    setData((current) => ({ ...current, locationUrl, locationLat, locationLng }));
  };

  const captureLocation = () => {
    // Silence here is the worst outcome: the user taps and nothing appears to happen,
    // so both the unsupported and denied paths have to say something.
    if (!navigator.geolocation) {
      toast(t('borrowers.locationUnavailable'), 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const locationUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
        setData((current) => ({ ...current, locationUrl, locationLat: coords.latitude, locationLng: coords.longitude }));
        setLocating(false);
      },
      () => {
        toast(t('borrowers.locationUnavailable'), 'error');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!data.name || data.name.trim().length < 2) {
      errs.name = t('common.required');
    }

    if (!data.mobile || !/^[6-9][0-9]{9}$/.test(data.mobile)) {
      errs.mobile = t('borrowers.mobileHint');
    }
    if (data.locationUrl && (data.locationLat === null || data.locationLng === null)) {
      errs.locationUrl = t('borrowers.locationInvalid');
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
    // A name typed directly in Telugu is already its own Telugu spelling.
    const trimmedName = data.name.trim();
    const nameTelugu = hasTeluguScript(trimmedName) ? trimmedName : data.nameTelugu.trim();
    await onSubmit({ ...data, nameTelugu });
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
      {/* Dictation writes both fields. What comes back is already Telugu, so it is the
          name and its Telugu spelling at once — there is nothing to transliterate, and
          nothing for a transliteration to get wrong. */}
      <Input
        label={t('borrowers.name')}
        value={data.name}
        onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
        error={errors.name}
        required
        rightSlot={
          <VoiceInput
            size="sm"
            prompt={t('voice.speak')}
            onResult={(spoken) => {
              const name = sanitiseSpokenName(spoken);
              if (!name) return;
              setData((d) => ({ ...d, name, nameTelugu: name }));
              setErrors((current) => ({ ...current, name: '' }));
            }}
          />
        }
      />

      <TeluguNamePreview
        name={data.name}
        value={data.nameTelugu}
        onChange={(nameTelugu) => setData((d) => ({ ...d, nameTelugu }))}
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

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label={t('borrowers.location')}
            value={data.locationUrl}
            onChange={(e) => {
              setLocationFromUrl(e.target.value);
              setErrors((current) => ({ ...current, locationUrl: '' }));
            }}
            error={errors.locationUrl}
            placeholder={t('borrowers.locationPlaceholder')}
            leftIcon={<MapPinIcon className="h-4 w-4" />}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={captureLocation}
          disabled={locating}
          loading={locating}
          aria-label={t('borrowers.captureLocation')}
          title={t('borrowers.captureLocation')}
        >
          <LocateIcon />
        </Button>
      </div>

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
                    <NameDisplay name={b.name} nameTelugu={b.nameTelugu} /> — {b.mobile}
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
