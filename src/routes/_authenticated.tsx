import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getSession } from '@/server/functions/auth';
import { setAuthUser } from '@/lib/stores';
import { OfflineScreen } from '@/components/shared/OfflineScreen';
import { isConnectionError } from '@/lib/connection';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { user } = await getSession();
    if (!user) {
      throw redirect({ to: '/login' });
    }
    return { user };
  },
  // A dropped connection must never look like a signed-out session, or the user is
  // bounced to the login screen and loses whatever they were doing.
  errorComponent: ({ error, reset }) => {
    if (isConnectionError(error)) {
      return <OfflineScreen onRetry={() => { reset(); window.location.reload(); }} />;
    }
    throw error;
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
