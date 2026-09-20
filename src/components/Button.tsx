import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, ...props }, ref) => {
    const baseStyles = 'font-medium transition-colors border border-transparent rounded-sm focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-neutral-500';

    const variantStyles = {
      primary: 'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-900',
      secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-100 border-neutral-200',
      ghost: 'text-neutral-900 hover:bg-neutral-100 active:bg-neutral-50',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? 'Loading...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
