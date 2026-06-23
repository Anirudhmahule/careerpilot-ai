/**
 * LoginPage
 *
 * Email + password sign-in form.
 * On success the user is redirected to /app/dashboard.
 * If already authenticated, the parent route redirects away before this renders.
 */

import * as React from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { ArrowRight, Mail } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import { AuthCard } from '../components/AuthCard';
import { AuthFormField } from '../components/AuthFormField';
import { PasswordInput } from '../components/PasswordInput';
import { AuthErrorAlert } from '../components/AuthErrorAlert';
import type { LoginFormValues } from '../types';

// ─── Validation ───────────────────────────────────────────────────────────────

type FieldErrors = Partial<Record<keyof LoginFormValues, string>>;

function validate(values: LoginFormValues): FieldErrors {
    const errors: FieldErrors = {};

    if (!values.email.trim()) {
        errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Enter a valid email address.';
    }

    if (!values.password) {
        errors.password = 'Password is required.';
    }

    return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginPage() {
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const [values, setValues] = React.useState<LoginFormValues>({
        email: '',
        password: '',
    });
    const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
    const [serverError, setServerError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        // Clear the field error as the user types
        if (fieldErrors[name as keyof LoginFormValues]) {
            setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
        }
        setServerError(null);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const errors = validate(values);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsSubmitting(true);
        setServerError(null);

        const error = await signIn(values.email.trim(), values.password);

        if (error) {
            setServerError(error.message);
            setIsSubmitting(false);
            return;
        }

        // Successful sign-in — navigate to the app
        await navigate({ to: '/app/dashboard', replace: true });
    }

    return (
        <AuthCard
            title="Welcome back"
            subtitle="Sign in to continue your journey."
        >
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {serverError && <AuthErrorAlert message={serverError} />}

                <AuthFormField
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={values.email}
                    onChange={handleChange}
                    error={fieldErrors.email}
                    leadingIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
                    disabled={isSubmitting}
                    required
                />

                <PasswordInput
                    label="Password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={values.password}
                    onChange={handleChange}
                    error={fieldErrors.password}
                    disabled={isSubmitting}
                    required
                />

                <div className="flex items-center justify-end">
                    <Link
                        to="/auth"
                        className="text-xs text-primary hover:underline focus:outline-none focus:underline"
                    >
                        Forgot password?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? (
                        <>
                            <Spinner />
                            Signing in…
                        </>
                    ) : (
                        <>
                            Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </>
                    )}
                </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
                New here?{' '}
                <Link
                    to="/auth/signup"
                    className="text-foreground hover:underline focus:outline-none focus:underline"
                >
                    Create an account
                </Link>
            </p>
        </AuthCard>
    );
}

// ─── Loading spinner ──────────────────────────────────────────────────────────

function Spinner() {
    return (
        <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
        </svg>
    );
}
