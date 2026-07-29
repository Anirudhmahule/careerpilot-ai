import { AlertCircle, HelpCircle } from 'lucide-react';
import { ValidationQuestionCard } from './ValidationQuestionCard';
import type { ValidationQuestionRow, MutateValidationAnswerRequest } from '../types/validation.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ValidationListProps {
    questions: ValidationQuestionRow[];
    isLoading: boolean;
    error: { message: string } | null;
    isSubmitting: boolean;
    onSubmitAnswer(request: MutateValidationAnswerRequest): Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ValidationList({
    questions,
    isLoading,
    error,
    isSubmitting,
    onSubmitAnswer,
}: ValidationListProps) {
    // ── Loading state ──────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-28 animate-pulse rounded-xl border border-border bg-card"
                    />
                ))}
            </div>
        );
    }

    // ── Error state ────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-5 text-destructive">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm">{error.message}</p>
            </div>
        );
    }

    // ── Empty state ────────────────────────────────────────────────────────────
    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-12 text-center">
                <HelpCircle className="h-10 w-10 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium">No questions yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Generate validation questions above to get started.
                    </p>
                </div>
            </div>
        );
    }

    // ── Question list ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-3">
            {questions.map((question, index) => (
                <ValidationQuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    onSubmitAnswer={onSubmitAnswer}
                    isSubmitting={isSubmitting}
                />
            ))}
        </div>
    );
}
