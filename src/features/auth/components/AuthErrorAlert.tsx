/**
 * AuthErrorAlert
 *
 * Accessible inline error banner shown at the top of auth forms.
 */

import { AlertCircle } from 'lucide-react';

interface AuthErrorAlertProps {
    message: string;
}

export function AuthErrorAlert({ message }: AuthErrorAlertProps) {
    return (
        <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{message}</span>
        </div>
    );
}
