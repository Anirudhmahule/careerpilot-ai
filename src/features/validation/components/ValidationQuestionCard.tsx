import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type {
    ValidationQuestionRow,
    MutateValidationAnswerRequest,
} from '../types/validation.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ValidationQuestionCardProps {
    question: ValidationQuestionRow;
    index: number;
    onSubmitAnswer(request: MutateValidationAnswerRequest): Promise<void>;
    isSubmitting: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExistingAnswer(question: ValidationQuestionRow) {
    return question.validation_answers[0] ?? null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ValidationQuestionCard({
    question,
    index,
    onSubmitAnswer,
    isSubmitting,
}: ValidationQuestionCardProps) {
    const existingAnswer = getExistingAnswer(question);
    const isAnswered = existingAnswer !== null;

    return (
        <div
            className={
                'rounded-xl border bg-card p-5 shadow-xs transition-colors ' +
                (isAnswered
                    ? 'border-success/40 bg-success/5'
                    : 'border-border')
            }
        >
            {/* Question header */}
            <div className="mb-4 flex items-start gap-3">
                <span
                    className={
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ' +
                        (isAnswered
                            ? 'bg-success text-white'
                            : 'bg-muted text-muted-foreground')
                    }
                >
                    {isAnswered ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <p className="text-sm font-medium leading-relaxed text-foreground">
                    {question.question_text}
                </p>
            </div>

            {/* Input area — dispatched by input_type */}
            <div className="pl-9">
                {question.input_type === 'BOOLEAN' && (
                    <BooleanInput
                        question={question}
                        existingAnswer={existingAnswer}
                        onSubmitAnswer={onSubmitAnswer}
                        isSubmitting={isSubmitting}
                    />
                )}
                {question.input_type === 'SINGLE_CHOICE' && (
                    <SingleChoiceInput
                        question={question}
                        existingAnswer={existingAnswer}
                        onSubmitAnswer={onSubmitAnswer}
                        isSubmitting={isSubmitting}
                    />
                )}
                {question.input_type === 'TEXT' && (
                    <TextInput
                        question={question}
                        existingAnswer={existingAnswer}
                        onSubmitAnswer={onSubmitAnswer}
                        isSubmitting={isSubmitting}
                    />
                )}
            </div>
        </div>
    );
}

// ─── BOOLEAN Input ─────────────────────────────────────────────────────────────

interface InputProps {
    question: ValidationQuestionRow;
    existingAnswer: ReturnType<typeof getExistingAnswer>;
    onSubmitAnswer(request: MutateValidationAnswerRequest): Promise<void>;
    isSubmitting: boolean;
}

function BooleanInput({ question, existingAnswer, onSubmitAnswer, isSubmitting }: InputProps) {
    const currentValue =
        existingAnswer?.boolean_value !== null && existingAnswer?.boolean_value !== undefined
            ? existingAnswer.boolean_value
            : null;

    const handleClick = async (value: boolean) => {
        if (isSubmitting) return;
        await onSubmitAnswer({
            questionId: question.id,
            answer: { type: 'BOOLEAN', value },
        });
    };

    return (
        <div className="flex gap-2">
            <button
                id={`q-${question.id}-yes`}
                onClick={() => handleClick(true)}
                disabled={isSubmitting}
                className={
                    'flex h-9 items-center gap-1.5 rounded-md border px-4 text-sm font-medium transition-colors disabled:opacity-50 ' +
                    (currentValue === true
                        ? 'border-success bg-success/10 text-success'
                        : 'border-border bg-background text-foreground hover:bg-accent')
                }
            >
                {currentValue === true && <Check className="h-3.5 w-3.5" />}
                Yes
            </button>
            <button
                id={`q-${question.id}-no`}
                onClick={() => handleClick(false)}
                disabled={isSubmitting}
                className={
                    'flex h-9 items-center gap-1.5 rounded-md border px-4 text-sm font-medium transition-colors disabled:opacity-50 ' +
                    (currentValue === false
                        ? 'border-destructive bg-destructive/10 text-destructive'
                        : 'border-border bg-background text-foreground hover:bg-accent')
                }
            >
                {currentValue === false && <Check className="h-3.5 w-3.5" />}
                No
            </button>
        </div>
    );
}

// ─── SINGLE_CHOICE Input ───────────────────────────────────────────────────────

function SingleChoiceInput({ question, existingAnswer, onSubmitAnswer, isSubmitting }: InputProps) {
    const selectedOptionId = existingAnswer?.selected_option_id ?? null;

    const handleSelect = async (optionId: string) => {
        if (isSubmitting) return;
        await onSubmitAnswer({
            questionId: question.id,
            answer: { type: 'SINGLE_CHOICE', optionId },
        });
    };

    if (question.validation_question_options.length === 0) {
        return (
            <p className="text-xs text-muted-foreground">No options available for this question.</p>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {question.validation_question_options.map((opt) => {
                const isSelected = opt.id === selectedOptionId;
                return (
                    <button
                        key={opt.id}
                        id={`q-${question.id}-opt-${opt.id}`}
                        onClick={() => handleSelect(opt.id)}
                        disabled={isSubmitting}
                        className={
                            'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-50 ' +
                            (isSelected
                                ? 'border-primary bg-primary-soft text-primary'
                                : 'border-border bg-background text-foreground hover:bg-accent')
                        }
                    >
                        <span
                            className={
                                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ' +
                                (isSelected
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground')
                            }
                        >
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                        </span>
                        {opt.option_label}
                    </button>
                );
            })}
        </div>
    );
}

// ─── TEXT Input ────────────────────────────────────────────────────────────────

function TextInput({ question, existingAnswer, onSubmitAnswer, isSubmitting }: InputProps) {
    const [value, setValue] = useState(existingAnswer?.text_value ?? '');
    const [isDirty, setIsDirty] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        setIsDirty(true);
    };

    const handleSubmit = async () => {
        const trimmed = value.trim();
        if (!trimmed || isSubmitting) return;
        await onSubmitAnswer({
            questionId: question.id,
            answer: { type: 'TEXT', value: trimmed },
        });
        setIsDirty(false);
    };

    return (
        <div className="flex flex-col gap-2">
            <textarea
                id={`q-${question.id}-text`}
                value={value}
                onChange={handleChange}
                disabled={isSubmitting}
                rows={3}
                placeholder="Type your answer here…"
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                    {existingAnswer?.text_value && !isDirty ? 'Saved' : ''}
                </span>
                <button
                    id={`q-${question.id}-submit`}
                    onClick={handleSubmit}
                    disabled={!value.trim() || isSubmitting}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {existingAnswer?.text_value ? 'Update' : 'Save'}
                    <ChevronDown className="h-3 w-3 -rotate-90" />
                </button>
            </div>
        </div>
    );
}
