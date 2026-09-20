import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-900 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 border border-neutral-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500 ${
            error ? 'border-red-300 focus:ring-red-500' : ''
          } ${className || ''}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-neutral-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
