import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-900 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-3 py-2 border border-neutral-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500 ${
            error ? 'border-red-300 focus:ring-red-500' : ''
          } ${className || ''}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
