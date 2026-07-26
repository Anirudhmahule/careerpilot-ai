/**
 * AuthFormField
 *
 * Thin wrapper around a labelled <input> that renders inline validation errors.
 * Purely presentational — no Supabase calls here.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AuthFormFieldProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    /** Optional icon rendered on the left side of the input */
    leadingIcon?: React.ReactNode;
    /** Optional element rendered on the right side (e.g. show-password toggle) */
    trailingElement?: React.ReactNode;
}

export const AuthFormField = React.forwardRef<
    HTMLInputElement,
    AuthFormFieldProps
>(
    (
        { label, error, leadingIcon, trailingElement, id, className, ...rest },
        ref,
    ) => {
        // Generate a stable id if none provided
        const fieldId = id ?? `auth-field-${label.toLowerCase().replace(/\s+/g, '-')}`;

        return (
            <div className="space-y-1.5">
                <label
                    htmlFor={fieldId}
                    className="block text-xs font-medium text-foreground"
                >
                    {label}
                </label>

                <div className="relative">
                    {leadingIcon && (
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                            {leadingIcon}
                        </span>
                    )}

                    <input
                        ref={ref}
                        id={fieldId}
                        aria-invalid={error ? 'true' : undefined}
                        aria-describedby={error ? `${fieldId}-error` : undefined}
                        className={cn(
                            'h-10 w-full rounded-md border bg-background text-sm text-foreground',
                            'placeholder:text-muted-foreground',
                            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15',
                            'transition-colors',
                            error ? 'border-destructive focus:ring-destructive/15' : 'border-border',
                            leadingIcon ? 'pl-8' : 'pl-3',
                            trailingElement ? 'pr-10' : 'pr-3',
                            className,
                        )}
                        {...rest}
                    />

                    {trailingElement && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2">
                            {trailingElement}
                        </span>
                    )}
                </div>

                {error && (
                    <p
                        id={`${fieldId}-error`}
                        role="alert"
                        className="text-xs text-destructive"
                    >
                        {error}
                    </p>
                )}
            </div>
        );
    },
);

AuthFormField.displayName = 'AuthFormField';
