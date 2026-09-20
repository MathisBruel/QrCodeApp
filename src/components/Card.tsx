import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={`border border-neutral-200 rounded-sm bg-white ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={`border-b border-neutral-200 px-6 py-4 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={`px-6 py-4 ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={`border-t border-neutral-200 px-6 py-4 bg-neutral-50 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};
