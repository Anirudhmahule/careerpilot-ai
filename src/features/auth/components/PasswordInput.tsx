/**
 * PasswordInput
 *
 * An AuthFormField specialisation that adds a show/hide toggle button.
 */

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AuthFormField, type AuthFormFieldProps } from './AuthFormField';

export type PasswordInputProps = Omit<AuthFormFieldProps, 'type' | 'trailingElement'>;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    (props, ref) => {
        const [visible, setVisible] = React.useState(false);

        return (
            <AuthFormField
                {...props}
                ref={ref}
                type={visible ? 'text' : 'password'}
                trailingElement={
                    <button
                        type="button"
                        aria-label={visible ? 'Hide password' : 'Show password'}
                        onClick={() => setVisible((v) => !v)}
                        className="grid h-10 w-10 place-items-center text-muted-foreground hover:text-foreground focus:outline-none"
                        tabIndex={-1}
                    >
                        {visible ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                    </button>
                }
            />
        );
    },
);

PasswordInput.displayName = 'PasswordInput';
