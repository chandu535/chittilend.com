import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ScrollPage } from '@/components/layout/PageLayout';
import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from '@/components/ui/Toast';
import { listManagers, createManager, toggleManagerActive } from '@/server/functions/users';
import { useScrollLock } from '@/lib/useScrollLock';

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
});

type Manager = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
};

function SettingsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const result = await listManagers();
      setManagers(result as unknown as Manager[]);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleToggle = async (managerId: string) => {
    try {
      await toggleManagerActive({ data: { managerId } });
      await fetchManagers();
      toast(t('common.save'), 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    }
  };

  return (
    <ScrollPage>
      <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h2>
      </div>

      {/* Managers Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>{t('settings.managers')}</CardTitle>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            {t('settings.addManager')}
          </Button>
        </div>

        {loading ? (
          <PageSkeleton variant="list" />
        ) : managers.length === 0 ? (
          <EmptyState title={t('common.noData')} />
        ) : (
          <div className="space-y-2">
            {/* Mobile: card view */}
            <div className="sm:hidden space-y-2">
              {managers.map((m) => (
                <div key={m.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-slate-900">{m.name}</span>
                    <Badge status={m.isActive ? 'active' : 'defaulted'}>
                      {m.isActive ? t('settings.activate') : t('settings.deactivate')}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{m.email}</p>
                  <Button
                    size="sm"
                    variant={m.isActive ? 'danger' : 'primary'}
                    onClick={() => handleToggle(m.id)}
                    className="w-full"
                  >
                    {m.isActive ? t('settings.deactivate') : t('settings.activate')}
                  </Button>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto overscroll-x-contain">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-3 font-medium">{t('settings.managerName')}</th>
                    <th className="pb-3 font-medium">{t('settings.managerEmail')}</th>
                    <th className="pb-3 font-medium">{t('common.status')}</th>
                    <th className="pb-3 font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {managers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-900">{m.name}</td>
                      <td className="py-3 text-slate-600">{m.email}</td>
                      <td className="py-3">
                        <Badge status={m.isActive ? 'active' : 'defaulted'}>
                          {m.isActive ? t('settings.activate') : t('settings.deactivate')}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant={m.isActive ? 'danger' : 'primary'}
                          onClick={() => handleToggle(m.id)}
                        >
                          {m.isActive ? t('settings.deactivate') : t('settings.activate')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Add Manager Modal */}
      {showAddModal && (
        <AddManagerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchManagers();
          }}
        />
      )}
      </div>
    </ScrollPage>
  );
}

function AddManagerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useScrollLock(true);

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      toast(t('common.required'), 'error');
      return;
    }
    setLoading(true);
    try {
      await createManager({ data: { name, email, password } });
      toast(t('settings.addManager'), 'success');
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-semibold text-slate-900">{t('settings.addManager')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <Input
            label={t('settings.managerName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            label={t('settings.managerEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <Input
            label={t('settings.managerPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            hint="Min 6 characters"
          />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} loading={loading} className="flex-1">
              {t('settings.addManager')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
