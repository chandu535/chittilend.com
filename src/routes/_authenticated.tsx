import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getSession } from '@/server/functions/auth';
import { setAuthUser } from '@/lib/stores';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { user } = await getSession();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();

  // Sync auth store from dehydrated route context before children render.
  // This ensures the store matches on both server and client for hydration.
  const synced = useRef(false);
  if (!synced.current) {
    setAuthUser(user);
    synced.current = true;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
