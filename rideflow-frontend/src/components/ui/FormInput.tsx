import React from 'react';
import { clsx } from 'clsx';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  register?: UseFormRegisterReturn;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className, register, ...props }, ref) => {
    // We have to extract value manually if uncontrolled but since we use react-hook-form, 
    // the label float depends on focus or the sibling input value
    return (
      <div className={clsx('relative w-full', className)}>
        <input
          ref={ref}
          {...register}
          {...props}
          onFocus={(e) => {
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            if (props.onBlur) props.onBlur(e);
            if (register?.onBlur) register.onBlur(e);
          }}
          className={clsx(
            'peer w-full bg-glass-bg-light border text-text-primary rounded-radius-md px-4 pt-6 pb-2 outline-none transition-all duration-300',
            error ? 'border-error shadow-[0_0_0_1px_#DC2626] animate-[shake_0.4s_ease-in-out]' : 'border-glass-border hover:border-glass-border-accent focus:border-amber-500 focus:shadow-[0_0_0_1px_#F59E0B]'
          )}
          placeholder=" " // necessary for the peer-placeholder-shown hack
        />
        <label
          className={clsx(
            'absolute left-4 transition-all duration-300 pointer-events-none',
            'peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-text-muted',
            'peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-amber-500',
            // If not empty, float it
            'top-1.5 text-xs text-text-secondary'
          )}
        >
          {label}
        </label>
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
