/**
 * SignupPage
 *
 * Email + password registration form.
 * On success shows a confirmation message (Supabase sends a verification email).
 * If Supabase is configured to auto-confirm, the user is redirected immediately.
 */

import * as React from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { ArrowRight, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import { AuthCard } from '../components/AuthCard';
import { AuthFormField } from '../components/AuthFormField';
import { PasswordInput } from '../components/PasswordInput';
import { AuthErrorAlert } from '../components/AuthErrorAlert';
import type { SignupFormValues } from '../types';

// ─── Validation ───────────────────────────────────────────────────────────────

type FieldErrors = Partial<Record<keyof SignupFormValues, string>>;

const PASSWORD_MIN = 8;

function validate(values: SignupFormValues): FieldErrors {
    const errors: FieldErrors = {};

    if (!values.email.trim()) {
        errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Enter a valid email address.';
    }

    if (!values.password) {
        errors.password = 'Password is required.';
    } else if (values.password.length < PASSWORD_MIN) {
        errors.password = `Password must be at least ${PASSWORD_MIN} characters.`;
    }

    if (!values.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password.';
    } else if (values.password !== values.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SignupPage() {
    const navigate = useNavigate();
    const { signUp } = useAuth();

    const [values, setValues] = React.useState<SignupFormValues>({
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
    const [serverError, setServerError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [emailSent, setEmailSent] = React.useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        if (fieldErrors[name as keyof SignupFormValues]) {
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

        const error = await signUp(values.email.trim(), values.password);

        if (error) {
            setServerError(error.message);
            setIsSubmitting(false);
            return;
        }

        // Supabase may auto-confirm or send a verification email depending on
        // project settings. We optimistically redirect; if a session was created
        // the protected route will let the user through immediately.
        try {
            await navigate({ to: '/app/dashboard', replace: true });
        } catch {
            // If navigation fails (e.g. email confirmation required), show the
            // confirmation message instead.
            setEmailSent(true);
            setIsSubmitting(false);
        }
    }

    if (emailSent) {
        return (
            <AuthCard
                title="Check your inbox"
                subtitle="We sent a confirmation link to your email."
            >
                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface py-8 text-center">
                        <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
                        <p className="text-sm text-muted-foreground">
                            Click the link in the email to activate your account, then sign in.
                        </p>
                    </div>
                    <Link
                        to="/auth/login"
                        className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Go to sign in <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </div>
            </AuthCard>
        );
    }

    return (
        <AuthCard
            title="Create your account"
            subtitle="Start navigating your career with precision."
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
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    value={values.password}
                    onChange={handleChange}
                    error={fieldErrors.password}
                    disabled={isSubmitting}
                    required
                />

                <PasswordInput
                    label="Confirm password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    error={fieldErrors.confirmPassword}
                    disabled={isSubmitting}
                    required
                />

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? (
                        <>
                            <Spinner />
                            Creating account…
                        </>
                    ) : (
                        <>
                            Create account <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </>
                    )}
                </button>

                <p className="text-center text-[11px] text-muted-foreground">
                    By creating an account you agree to our{' '}
                    <a href="#" className="text-foreground hover:underline">
                        Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-foreground hover:underline">
                        Privacy Policy
                    </a>
                    .
                </p>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link
                    to="/auth/login"
                    className="text-foreground hover:underline focus:outline-none focus:underline"
                >
                    Sign in
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
