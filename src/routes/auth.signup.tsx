/**
 * /auth/signup
 */

import { createFileRoute } from '@tanstack/react-router';
import { SignupPage } from '@/features/auth';

export const Route = createFileRoute('/auth/signup')({
    head: () => ({
        meta: [{ title: 'Create account — CareerPilot AI' }],
    }),
    component: SignupPage,
});
