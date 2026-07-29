/**
 * PasswordInput
 *
 * A bare password input with a show/hide toggle button.
 * Does NOT render a label or error message — those come from the parent
 * (either shadcn FormItem/FormLabel/FormMessage, or AuthFormField).
 *
 * Forwards its ref to the underlying <input> so it works correctly inside
 * shadcn's <FormControl> (which uses Radix Slot to inject aria-* props).
 */

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, disabled, ...rest }, ref) => {
        const [visible, setVisible] = React.useState(false);

        return (
            <div className="relative">
                <input
                    {...rest}
                    ref={ref}
                    type={visible ? 'text' : 'password'}
                    disabled={disabled}
                    className={cn(
                        'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-10',
                        'text-sm shadow-sm transition-colors',
                        'placeholder:text-muted-foreground',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        className,
                    )}
                />
                <button
                    type="button"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    onClick={() => setVisible((v) => !v)}
                    disabled={disabled}
                    tabIndex={-1}
                    className="absolute right-0 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center text-muted-foreground hover:text-foreground focus:outline-none disabled:pointer-events-none"
                >
                    {visible ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                </button>
            </div>
        );
    },
);

PasswordInput.displayName = 'PasswordInput';
