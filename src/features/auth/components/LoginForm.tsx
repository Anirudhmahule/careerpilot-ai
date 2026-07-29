/**
 * LoginForm
 *
 * Email + password sign-in form built with React Hook Form + Zod.
 * Receives onSuccess/onError callbacks — owns no navigation logic.
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
import { Link } from '@tanstack/react-router';
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

const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required.')
        .email('Enter a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
});

type LoginSchema = z.infer<typeof loginSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface LoginFormProps {
    onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginForm({ onSuccess }: LoginFormProps) {
    const { signIn } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);

    const form = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const { isSubmitting } = form.formState;

    async function onSubmit(values: LoginSchema) {
        setServerError(null);
        const error = await signIn(values.email, values.password);
        if (error) {
            setServerError(error.message);
            return;
        }
        onSuccess();
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
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-xs font-medium">Password</FormLabel>
                            </div>
                            <FormControl>
                                <PasswordInput
                                    {...field}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

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
                            Signing in…
                        </>
                    ) : (
                        <>
                            Sign in
                            <ArrowRight aria-hidden="true" />
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}
