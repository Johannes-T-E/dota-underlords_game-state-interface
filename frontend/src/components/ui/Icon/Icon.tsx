import './Icon.css';

export type IconType = 'gold' | 'health' | 'unit' | 'level';
export type IconSize = 'small' | 'medium' | 'large';

export interface IconProps {
  type: IconType;
  size?: IconSize;
  className?: string;
}

export const Icon = ({ type, size = 'medium', className = '' }: IconProps) => {
  return (
    <div 
      className={`icon icon--${type} icon--${size} ${className}`}
      aria-label={type}
    />
  );
};

