import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { listBorrowers, listAreas } from '@/server/functions/borrowers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BorrowerCard } from '@/components/borrowers/BorrowerCard';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { formatPhone } from '@/lib/formatters';

export const Route = createFileRoute('/_authenticated/borrowers/')({
  component: BorrowersPage,
});

function BorrowersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<string[]>([]);
  const [result, setResult] = useState<{
    items: Array<{
      id: string;
      name: string;
      mobile: string;
      area: string | null;
      profilePhotoUrl: string | null;
    }>;
    total: number;
    totalPages: number;
  }>({ items: [], total: 0, totalPages: 0 });

  const fetchBorrowers = async () => {
    setLoading(true);
    try {
      const data = await listBorrowers({ data: { page, limit, area, search } });
      setResult(data);
    } catch {
      // handled by error boundary
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const data = await listAreas();
      setAreas(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    fetchBorrowers();
  }, [page, area]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchBorrowers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{t('borrowers.title')}</h2>
        <Link to="/borrowers/new">
          <Button size="sm">{t('borrowers.newBorrower')}</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <Select
          value={area}
          onChange={(e) => { setArea(e.target.value); setPage(1); }}
          options={[
            { value: 'all', label: t('common.all') },
            ...areas.map((a) => ({ value: a, label: a })),
          ]}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : result.items.length === 0 ? (
        <EmptyState
          title={t('borrowers.noBorrowers')}
          action={
            <Link to="/borrowers/new">
              <Button>{t('borrowers.newBorrower')}</Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Mobile: card view */}
          <div className="sm:hidden space-y-3">
            {result.items.map((b) => (
              <BorrowerCard
                key={b.id}
                id={b.id}
                name={b.name}
                mobile={b.mobile}
                area={b.area}
                photoUrl={b.profilePhotoUrl}
              />
            ))}
          </div>

          {/* Desktop: table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 font-medium">{t('borrowers.name')}</th>
                  <th className="pb-3 font-medium">{t('borrowers.mobile')}</th>
                  <th className="pb-3 font-medium">{t('borrowers.area')}</th>
                  <th className="pb-3 font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.items.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <BorrowerAvatar name={b.name} photoUrl={b.profilePhotoUrl} size="sm" />
                        <NameDisplay name={b.name} />
                      </div>
                    </td>
                    <td className="py-3 text-slate-600">{formatPhone(b.mobile)}</td>
                    <td className="py-3 text-slate-600">{b.area || '—'}</td>
                    <td className="py-3">
                      <Link
                        to="/borrowers/$borrowerId"
                        params={{ borrowerId: b.id }}
                        className="text-primary hover:underline text-sm"
                      >
                        {t('common.viewAll')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t('common.back')}
              </Button>
              <span className="text-sm text-slate-500">
                {page} / {result.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
                disabled={page === result.totalPages}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
