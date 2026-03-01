import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppShell } from '@/components/layout/AppShell';
import { getSession } from '@/server/functions/auth';
import { setAuthUser } from '@/lib/stores';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { user } = await getSession();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    setAuthUser(user);
    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
