import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useStore } from '@tanstack/react-store';
import { clsx } from 'clsx';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { uiStore } from '@/lib/stores';

type Preset = 'thisWeek' | 'thisMonth' | 'thisYear' | 'month' | 'custom';

interface TimeFilterProps {
  onRangeChange: (dateFrom: string, dateTo: string) => void;
  /** How many years back the year dropdown offers. */
  yearsBack?: number;
}

/** Local calendar date as YYYY-MM-DD. Avoids toISOString, which shifts across UTC. */
function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function getPresetRange(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const to = isoDate(now);

  switch (preset) {
    case 'thisWeek': {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return { from: isoDate(start), to };
    }
    case 'thisMonth':
      return { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to };
    case 'thisYear':
      return { from: isoDate(new Date(now.getFullYear(), 0, 1)), to };
    default:
      return { from: '', to: '' };
  }
}

/** First and last day of the given month. Day 0 of the next month is the last of this one. */
function getMonthRange(month: number, year: number): { from: string; to: string } {
  return {
    from: isoDate(new Date(year, month, 1)),
    to: isoDate(new Date(year, month + 1, 0)),
  };
}

export function TimeFilter({ onRangeChange, yearsBack = 5 }: TimeFilterProps) {
  const { t } = useTranslation();
  const language = useStore(uiStore, (s) => s.language);
  const now = new Date();

  const [active, setActive] = useState<Preset>('month');
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const presets: { key: Preset; label: string }[] = [
    { key: 'thisWeek', label: t('analytics.thisWeek') },
    { key: 'thisMonth', label: t('analytics.thisMonth') },
    { key: 'thisYear', label: t('analytics.thisYear') },
    { key: 'month', label: t('analytics.pickMonth') },
    { key: 'custom', label: t('analytics.custom') },
  ];

  // Month names in the active language, so Telugu shows Telugu months.
  const monthFormatter = new Intl.DateTimeFormat(language === 'te' ? 'te-IN' : 'en-IN', {
    month: 'long',
  });
  const monthOptions = Array.from({ length: 12 }, (_, index) => ({
    value: String(index),
    label: monthFormatter.format(new Date(2000, index, 1)),
  }));
  const yearOptions = Array.from({ length: yearsBack + 1 }, (_, index) => {
    const value = now.getFullYear() - index;
    return { value: String(value), label: String(value) };
  });

  const handlePreset = (preset: Preset) => {
    setActive(preset);
    if (preset === 'month') {
      const range = getMonthRange(month, year);
      onRangeChange(range.from, range.to);
      return;
    }
    if (preset !== 'custom') {
      const range = getPresetRange(preset);
      onRangeChange(range.from, range.to);
    }
  };

  // Dropdowns apply immediately — an Apply button for a two-field choice is friction.
  const applyMonth = (nextMonth: number, nextYear: number) => {
    setMonth(nextMonth);
    setYear(nextYear);
    const range = getMonthRange(nextMonth, nextYear);
    onRangeChange(range.from, range.to);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1 overflow-x-auto overscroll-x-contain rounded-lg bg-slate-100 p-1">
        {presets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => handlePreset(preset.key)}
            className={clsx(
              'min-h-9 flex-1 whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
              active === preset.key
                ? 'bg-card text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {active === 'month' && (
        <div className="flex items-center gap-2">
          <Select
            value={String(month)}
            onChange={(e) => applyMonth(Number(e.target.value), year)}
            options={monthOptions}
            aria-label={t('analytics.month')}
            className="min-h-10 py-2 text-sm"
          />
          <Select
            value={String(year)}
            onChange={(e) => applyMonth(month, Number(e.target.value))}
            options={yearOptions}
            aria-label={t('analytics.year')}
            className="min-h-10 py-2 text-sm"
          />
        </div>
      )}

      {active === 'custom' && (
        <div className="flex items-end gap-2">
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
            onClick={() => { if (customFrom && customTo) onRangeChange(customFrom, customTo); }}
            disabled={!customFrom || !customTo}
          >
            {t('analytics.apply')}
          </Button>
        </div>
      )}
    </div>
  );
}
