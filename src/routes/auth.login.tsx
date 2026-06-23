/**
 * /auth/login
 *
 * Accepts an optional `redirect` search param so the user is sent back
 * to the page they were trying to reach after signing in.
 */

import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { LoginPage } from '@/features/auth';

const loginSearchSchema = z.object({
    redirect: z.string().optional(),
});

export const Route = createFileRoute('/auth/login')({
    head: () => ({
        meta: [{ title: 'Sign in — CareerPilot AI' }],
    }),
    validateSearch: loginSearchSchema,
    component: LoginPage,
});
