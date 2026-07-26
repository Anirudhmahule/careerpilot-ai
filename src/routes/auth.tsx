/**
 * /auth layout route
 *
 * Acts as a guard: if the user is already authenticated, redirect them to
 * /app/dashboard immediately so they never see the login/signup forms.
 *
 * Child routes (/auth/login, /auth/signup) render via <Outlet />.
 */

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authService } from '@/features/auth';

export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [{ title: 'Sign in — CareerPilot AI' }],
  }),

  // Server + client loader: if a valid session exists, bounce to the app
  beforeLoad: async () => {
    const { data: session } = await authService.getSession();
    if (session) {
      throw redirect({ to: '/app/dashboard', replace: true });
    }
  },

  component: AuthLayout,
});

function AuthLayout() {
  return <Outlet />;
}
