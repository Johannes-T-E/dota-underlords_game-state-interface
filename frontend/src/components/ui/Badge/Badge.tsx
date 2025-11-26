import { ReactNode } from 'react';
import './Badge.css';

export type BadgeVariant = 'bot' | 'completed' | 'in-progress' | 'win' | 'loss';

export interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export const Badge = ({ variant, children, className = '' }: BadgeProps) => {
  return (
    <span className={`badge badge--${variant} ${className}`}>
      {children}
    </span>
  );
};

