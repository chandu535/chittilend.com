import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';

type Preset = 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';

interface TimeFilterProps {
  onRangeChange: (dateFrom: string, dateTo: string) => void;
}

function getPresetRange(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];

  switch (preset) {
    case 'thisWeek': {
      const day = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - day);
      return { from: start.toISOString().split('T')[0], to };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start.toISOString().split('T')[0], to };
    }
    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { from: start.toISOString().split('T')[0], to };
    }
    default:
      return { from: '', to: '' };
  }
}

export function TimeFilter({ onRangeChange }: TimeFilterProps) {
  const { t } = useTranslation();
  const [active, setActive] = useState<Preset>('thisMonth');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const presets: { key: Preset; label: string }[] = [
    { key: 'thisWeek', label: t('analytics.thisWeek') },
    { key: 'thisMonth', label: t('analytics.thisMonth') },
    { key: 'thisYear', label: t('analytics.thisYear') },
    { key: 'custom', label: t('analytics.custom') },
  ];

  const handlePreset = (preset: Preset) => {
    setActive(preset);
    if (preset !== 'custom') {
      const range = getPresetRange(preset);
      onRangeChange(range.from, range.to);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => handlePreset(p.key)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors min-h-[36px] ${
              active === p.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {active === 'custom' && (
        <div className="flex gap-2 items-end">
          <DatePicker
            label={t('analytics.from')}
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
          />
          <DatePicker
            label={t('analytics.to')}
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => {
              if (customFrom && customTo) onRangeChange(customFrom, customTo);
            }}
            disabled={!customFrom || !customTo}
          >
            {t('analytics.apply')}
          </Button>
        </div>
      )}
    </div>
  );
}
