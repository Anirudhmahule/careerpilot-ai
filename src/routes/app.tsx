/**
 * /app layout route — protected
 *
 * beforeLoad runs before any child route renders.
 * Unauthenticated users are redirected to /auth/login with a `redirect`
 * search param so we can send them back after sign-in.
 */

import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppShell } from '@/components/app-shell';
import { authService } from '@/features/auth';

export const Route = createFileRoute('/app')({
  beforeLoad: async ({ location }) => {
    if (typeof window === 'undefined') return;

    const { data: session } = await authService.getSession();
    if (!session) {
      throw redirect({
        to: '/auth/login',
        search: { redirect: location.href },
        replace: true,
      });
    }
  },

  component: AppShell,
});
