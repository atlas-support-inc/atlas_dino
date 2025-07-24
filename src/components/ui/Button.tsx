import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variantClasses = {
      primary:
        'bg-primary text-white hover:bg-primary-hover focus:ring-primary',
      secondary:
        'bg-secondary text-white hover:bg-slate-600 focus:ring-secondary',
    };

    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };