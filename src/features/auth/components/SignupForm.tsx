/**
 * SignupForm
 *
 * Email + password registration form built with React Hook Form + Zod.
 * Delegates auth to useAuth(). Calls onSuccess(needsEmailConfirmation)
 * so the parent page decides what to render next.
 *
 * Rules:
 *  - No direct Supabase usage
 *  - Auth actions only through useAuth()
 *  - shadcn/ui Form primitives for every field
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Loader2, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

import { useAuth } from '../hooks/use-auth';
import { AuthErrorAlert } from './AuthErrorAlert';
import { PasswordInput } from './PasswordInput';

// ─── Schema ───────────────────────────────────────────────────────────────────

const signupSchema = z
    .object({
        email: z
            .string()
            .min(1, 'Email is required.')
            .email('Enter a valid email address.'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters.')
            .max(72, 'Password must be under 72 characters.'),
        confirmPassword: z.string().min(1, 'Please confirm your password.'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
    });

type SignupSchema = z.infer<typeof signupSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface SignupFormProps {
    /** Called with true when email confirmation is required, false when auto-confirmed. */
    onSuccess: (needsEmailConfirmation: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SignupForm({ onSuccess }: SignupFormProps) {
    const { signUp, isAuthenticated } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);

    const form = useForm<SignupSchema>({
        resolver: zodResolver(signupSchema),
        defaultValues: { email: '', password: '', confirmPassword: '' },
    });

    const { isSubmitting } = form.formState;

    async function onSubmit(values: SignupSchema) {
        setServerError(null);
        const error = await signUp(values.email, values.password);

        if (error) {
            setServerError(error.message);
            return;
        }

        // If the AuthProvider already has a session, Supabase auto-confirmed.
        // Otherwise, a confirmation email was sent.
        onSuccess(!isAuthenticated);
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
                className="space-y-5"
            >
                {/* ── Server error ─────────────────────────────────────────────── */}
                {serverError && <AuthErrorAlert message={serverError} />}

                {/* ── Email ────────────────────────────────────────────────────── */}
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-medium">Email</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Mail
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <Input
                                        {...field}
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@company.com"
                                        disabled={isSubmitting}
                                        className="h-10 pl-9 text-sm"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

                {/* ── Password ─────────────────────────────────────────────────── */}
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-medium">Password</FormLabel>
                            <FormControl>
                                <PasswordInput
                                    {...field}
                                    autoComplete="new-password"
                                    placeholder="Min. 8 characters"
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

                {/* ── Confirm password ─────────────────────────────────────────── */}
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-medium">
                                Confirm password
                            </FormLabel>
                            <FormControl>
                                <PasswordInput
                                    {...field}
                                    autoComplete="new-password"
                                    placeholder="Repeat your password"
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

                {/* ── Legal note ───────────────────────────────────────────────── */}
                <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                    By creating an account you agree to our{' '}
                    <span className="text-foreground font-medium">Terms of Service</span>{' '}
                    and{' '}
                    <span className="text-foreground font-medium">Privacy Policy</span>
                    .
                </p>

                {/* ── Submit ───────────────────────────────────────────────────── */}
                <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" aria-hidden="true" />
                            Creating account…
                        </>
                    ) : (
                        <>
                            Create account
                            <ArrowRight aria-hidden="true" />
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}
