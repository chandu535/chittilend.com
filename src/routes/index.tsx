import { createFileRoute, redirect } from '@tanstack/react-router';
import { getSession } from '@/server/functions/auth';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { user } = await getSession();
    if (user) {
      throw redirect({ to: '/dashboard' });
    } else {
      throw redirect({ to: '/login' });
    }
  },
});
