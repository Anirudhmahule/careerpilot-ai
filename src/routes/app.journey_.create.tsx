/**
 * /app/journey/create
 *
 * Standalone full-page route — does NOT render inside /app/journey's component.
 * The trailing underscore in the filename (journey_) tells TanStack Router to
 * treat this as a direct child of /app rather than nesting it inside the
 * app.journey component's outlet.
 *
 * Accessible to all authenticated users, including those without a journey yet
 * (this is specifically the page they are redirected to when journey is null).
 */

import { createFileRoute } from '@tanstack/react-router';
import { JourneyWizardPage } from '@/features/journey/pages/JourneyWizardPage';

export const Route = createFileRoute('/app/journey_/create')({
    head: () => ({
        meta: [{ title: 'Create journey — CareerPilot AI' }],
    }),
    component: JourneyWizardPage,
});
