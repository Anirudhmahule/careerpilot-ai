/**
 * /auth/login
 */

import { createFileRoute } from '@tanstack/react-router';
import { LoginPage } from '@/features/auth';

export const Route = createFileRoute('/auth/login')({
    head: () => ({
        meta: [{ title: 'Sign in — CareerPilot AI' }],
    }),
    component: LoginPage,
});
