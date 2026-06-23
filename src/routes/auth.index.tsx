/**
 * /auth  →  /auth/login  (index redirect)
 */

import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/')({
    beforeLoad: () => {
        throw redirect({ to: '/auth/login', replace: true });
    },
    component: () => null,
});
