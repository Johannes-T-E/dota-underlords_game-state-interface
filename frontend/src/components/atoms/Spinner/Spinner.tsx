import './Spinner.css';

export type SpinnerSize = 'small' | 'medium' | 'large';

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export const Spinner = ({ size = 'medium', className = '' }: SpinnerProps) => {
  return (
    <div className={`spinner spinner--${size} ${className}`} aria-label="Loading..." />
  );
};

