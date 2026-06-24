import { useState } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useJourney } from '../hooks/useJourney';
import type { JourneyRole, ExperienceLevel } from '../types/journey.types';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const wizardSchema = z.object({
    target_role: z.enum([
        'Software Engineer',
        'Frontend Engineer',
        'React Developer',
        'Full Stack Engineer',
        'Backend Engineer',
    ] as const),
    experience_level: z.enum([
        'Student',
        'Fresher',
        'Junior',
        'Mid-Level',
    ] as const),
    timeline_months: z.number().int().positive(),
    daily_study_hours: z.number().int().positive(),
});

type WizardValues = z.infer<typeof wizardSchema>;

// ─── Static option data ───────────────────────────────────────────────────────

interface RoleOption {
    value: JourneyRole;
    label: string;
    description: string;
    icon: string;
}

interface LevelOption {
    value: ExperienceLevel;
    label: string;
    description: string;
}

interface NumericOption {
    value: number;
    label: string;
    sublabel: string;
}

const ROLE_OPTIONS: RoleOption[] = [
    {
        value: 'Software Engineer',
        label: 'Software Engineer',
        description: 'General software engineering roles',
        icon: '💻',
    },
    {

        value: 'Frontend Engineer',
        label: 'Frontend Engineer',
        description: 'HTML, CSS, JS, frameworks & UX',
        icon: '🎨',
    },
    {
        value: 'React Developer',
        label: 'React Developer',
        description: 'React ecosystem & modern patterns',
        icon: '⚛️',
    },
    {
        value: 'Full Stack Engineer',
        label: 'Full Stack Engineer',
        description: 'Frontend + backend + databases',
        icon: '🔧',
    },
    {
        value: 'Backend Engineer',
        label: 'Backend Engineer',
        description: 'APIs, databases & infrastructure',
        icon: '⚙️',
    },
];

const LEVEL_OPTIONS: LevelOption[] = [
    {
        value: 'Student',
        label: 'Student',
        description: 'Currently studying, no professional experience',
    },
    {
        value: 'Fresher',
        label: 'Fresher',
        description: 'Graduated, ready for my first role',
    },
    {
        value: 'Junior',
        label: 'Junior',
        description: '0 – 2 years of professional experience',
    },
    {
        value: 'Mid-Level',
        label: 'Mid-Level',
        description: '2 – 5 years of professional experience',
    },
];

const TIMELINE_OPTIONS: NumericOption[] = [
    { value: 3, label: '3 Months', sublabel: 'Fast track' },
    { value: 6, label: '6 Months', sublabel: 'Recommended' },
    { value: 12, label: '12 Months', sublabel: 'Thorough' },
];

const HOURS_OPTIONS: NumericOption[] = [
    { value: 1, label: '1 Hour', sublabel: 'Light pace' },
    { value: 2, label: '2 Hours', sublabel: 'Steady pace' },
    { value: 4, label: '4 Hours', sublabel: 'Intensive' },
    { value: 6, label: '6 Hours', sublabel: 'Full focus' },
];

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEPS = [
    { index: 0, title: 'Target Role', description: 'What role are you aiming for?' },
    { index: 1, title: 'Experience Level', description: 'Where are you right now?' },
    { index: 2, title: 'Timeline', description: 'How long do you have to prepare?' },
    { index: 3, title: 'Daily Study Time', description: 'How many hours can you commit each day?' },
    { index: 4, title: 'Review', description: 'Confirm your setup before we build your roadmap.' },
] as const;

const TOTAL_STEPS = STEPS.length; // 5 including review

// ─── Page ─────────────────────────────────────────────────────────────────────

export function JourneyWizardPage() {
    const navigate = useNavigate();
    const router = useRouter();
    const { createJourney } = useJourney();
    const [currentStep, setCurrentStep] = useState(0);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        watch,
        setValue,
        trigger,
        handleSubmit,
        formState: { isSubmitting, errors },
    } = useForm<WizardValues>({
        resolver: zodResolver(wizardSchema),
        mode: 'onChange',
    });

    const values = watch();
    const step = STEPS[currentStep];

    // ─── Field name for the active step ────────────────────────────────────────

    const stepField: Record<number, keyof WizardValues> = {
        0: 'target_role',
        1: 'experience_level',
        2: 'timeline_months',
        3: 'daily_study_hours',
    };

    // ─── Navigation ────────────────────────────────────────────────────────────

    async function goNext() {
        if (currentStep >= TOTAL_STEPS - 2) {
            // Moving to review — validate all fields at once
            const valid = await trigger();
            if (valid) setCurrentStep(4);
            return;
        }
        const field = stepField[currentStep];
        const valid = await trigger(field);
        if (valid) setCurrentStep((s) => s + 1);
    }

    function goBack() {
        setServerError(null);
        setCurrentStep((s) => Math.max(0, s - 1));
    }

    // ─── Submit ─────────────────────────────────────────────────────────────────

    async function onSubmit(data: WizardValues) {
        setServerError(null);

        const error = await createJourney(data);

        if (error) {
            setServerError(error.message);
            return;
        }

        const unsubscribe = router.subscribe('onResolved', () => {
            console.log('ROUTE RESOLVED', window.location.pathname);
            unsubscribe();
        });

        console.log('BEFORE NAVIGATE', window.location.pathname);
        void navigate({
            to: '/app/dashboard',
            replace: true,
        });
        console.log('AFTER NAVIGATE CALL', window.location.pathname);
    }

    // ─── Progress ───────────────────────────────────────────────────────────────

    // Steps 0-3 count as progress; review (4) = 100 %
    const progressPct =
        currentStep < 4
            ? Math.round((currentStep / 4) * 100)
            : 100;

    // ─── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
            {/* ── Logo ──────────────────────────────────────────────────────────── */}
            <div className="mb-8 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="text-[15px] font-semibold tracking-tight">CareerPilot</span>
                <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    AI
                </span>
            </div>

            {/* ── Card ──────────────────────────────────────────────────────────── */}
            <Card className="w-full max-w-lg shadow-lg">
                {/* ── Header ──────────────────────────────────────────────────────── */}
                <CardHeader className="pb-4">
                    {/* Step counter + progress */}
                    <div className="mb-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                                Step {Math.min(currentStep + 1, TOTAL_STEPS)} of {TOTAL_STEPS}
                            </span>
                            <span>{progressPct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-border">
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                                style={{ width: `${progressPct}%` }}
                                role="progressbar"
                                aria-valuenow={progressPct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label="Wizard progress"
                            />
                        </div>
                    </div>

                    {/* Dot indicators */}
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                        {STEPS.map((s) => (
                            <span
                                key={s.index}
                                className={cn(
                                    'h-1.5 rounded-full transition-all duration-200',
                                    s.index < currentStep
                                        ? 'w-4 bg-primary'
                                        : s.index === currentStep
                                            ? 'w-4 bg-primary'
                                            : 'w-1.5 bg-border',
                                )}
                            />
                        ))}
                    </div>

                    <CardTitle className="mt-3 text-xl">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                </CardHeader>

                <CardContent className="pb-6">
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        {/* ── Step 0: Target role ─────────────────────────────────────── */}
                        {currentStep === 0 && (
                            <OptionGrid aria-label="Select target role">
                                {ROLE_OPTIONS.map((opt) => (
                                    <OptionTile
                                        key={opt.value}
                                        selected={values.target_role === opt.value}
                                        onClick={() => setValue('target_role', opt.value, { shouldValidate: true })}
                                    >
                                        <span className="text-2xl" aria-hidden="true">{opt.icon}</span>
                                        <span className="mt-2 block text-sm font-medium">{opt.label}</span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {opt.description}
                                        </span>
                                    </OptionTile>
                                ))}
                            </OptionGrid>
                        )}

                        {/* ── Step 1: Experience level ─────────────────────────────────── */}
                        {currentStep === 1 && (
                            <OptionGrid aria-label="Select experience level">
                                {LEVEL_OPTIONS.map((opt) => (
                                    <OptionTile
                                        key={opt.value}
                                        selected={values.experience_level === opt.value}
                                        onClick={() =>
                                            setValue('experience_level', opt.value, { shouldValidate: true })
                                        }
                                    >
                                        <span className="block text-sm font-medium">{opt.label}</span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {opt.description}
                                        </span>
                                    </OptionTile>
                                ))}
                            </OptionGrid>
                        )}

                        {/* ── Step 2: Timeline ────────────────────────────────────────── */}
                        {currentStep === 2 && (
                            <OptionGrid cols={3} aria-label="Select timeline">
                                {TIMELINE_OPTIONS.map((opt) => (
                                    <OptionTile
                                        key={opt.value}
                                        selected={values.timeline_months === opt.value}
                                        onClick={() =>
                                            setValue('timeline_months', opt.value, { shouldValidate: true })
                                        }
                                    >
                                        <span className="block text-lg font-semibold tabular-nums">
                                            {opt.label}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {opt.sublabel}
                                        </span>
                                    </OptionTile>
                                ))}
                            </OptionGrid>
                        )}

                        {/* ── Step 3: Daily study hours ────────────────────────────────── */}
                        {currentStep === 3 && (
                            <OptionGrid cols={4} aria-label="Select daily study hours">
                                {HOURS_OPTIONS.map((opt) => (
                                    <OptionTile
                                        key={opt.value}
                                        selected={values.daily_study_hours === opt.value}
                                        onClick={() =>
                                            setValue('daily_study_hours', opt.value, { shouldValidate: true })
                                        }
                                    >
                                        <span className="block text-lg font-semibold tabular-nums">
                                            {opt.label}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {opt.sublabel}
                                        </span>
                                    </OptionTile>
                                ))}
                            </OptionGrid>
                        )}

                        {/* ── Step 4: Review ──────────────────────────────────────────── */}
                        {currentStep === 4 && (
                            <ReviewPanel values={values} />
                        )}

                        {/* ── Validation error (field not selected) ───────────────────── */}
                        {currentStep < 4 && errors[stepField[currentStep]] && (
                            <p role="alert" className="mt-3 text-xs text-destructive">
                                Please make a selection to continue.
                            </p>
                        )}

                        {/* ── Server error ────────────────────────────────────────────── */}
                        {serverError && (
                            <div
                                role="alert"
                                className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                            >
                                <span>{serverError}</span>
                            </div>
                        )}

                        {/* ── Footer navigation ────────────────────────────────────────── */}
                        <div
                            className={cn(
                                'mt-6 flex gap-3',
                                currentStep === 0 ? 'justify-end' : 'justify-between',
                            )}
                        >
                            {currentStep > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={goBack}
                                    disabled={isSubmitting}
                                >
                                    <ArrowLeft aria-hidden="true" />
                                    Back
                                </Button>
                            )}

                            {currentStep < 4 ? (
                                <Button
                                    type="button"
                                    onClick={goNext}
                                    disabled={isSubmitting}
                                >
                                    {currentStep === 3 ? 'Review' : 'Continue'}
                                    <ArrowRight aria-hidden="true" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="min-w-36"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin" aria-hidden="true" />
                                            Creating…
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 aria-hidden="true" />
                                            Create Journey
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OptionGrid({
    children,
    cols = 2,
    'aria-label': ariaLabel,
}: {
    children: React.ReactNode;
    cols?: 2 | 3 | 4;
    'aria-label'?: string;
}) {
    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className={cn('grid gap-3', {
                'grid-cols-1 sm:grid-cols-2': cols === 2,
                'grid-cols-3': cols === 3,
                'grid-cols-2 sm:grid-cols-4': cols === 4,
            })}
        >
            {children}
        </div>
    );
}

function OptionTile({
    selected,
    onClick,
    children,
}: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={cn(
                'relative flex flex-col rounded-xl border p-4 text-left transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                'hover:border-primary/50 hover:bg-accent',
                selected
                    ? 'border-primary bg-primary-soft shadow-sm ring-1 ring-primary/20'
                    : 'border-border bg-card',
            )}
        >
            {selected && (
                <span className="absolute right-2.5 top-2.5">
                    <CheckCircle2
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                    />
                </span>
            )}
            {children}
        </button>
    );
}

function ReviewPanel({ values }: { values: Partial<WizardValues> }) {
    const rows: { label: string; value: string | undefined }[] = [
        { label: 'Target role', value: values.target_role },
        { label: 'Experience level', value: values.experience_level },
        {
            label: 'Timeline',
            value: values.timeline_months ? `${values.timeline_months} months` : undefined,
        },
        {
            label: 'Daily study time',
            value: values.daily_study_hours ? `${values.daily_study_hours} ${values.daily_study_hours === 1 ? 'hour' : 'hours'}` : undefined,
        },
    ];

    return (
        <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-border">
                {rows.map((row, i) => (
                    <div
                        key={row.label}
                        className={cn(
                            'flex items-center justify-between px-4 py-3 text-sm',
                            i < rows.length - 1 && 'border-b border-border',
                        )}
                    >
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-medium text-foreground">
                            {row.value ?? <span className="text-destructive">Not set</span>}
                        </span>
                    </div>
                ))}
            </div>

            <p className="text-xs text-muted-foreground">
                You can update these settings at any time from your journey settings.
            </p>
        </div>
    );
}
