import { ReactNode, HTMLAttributes } from 'react';
import './Text.css';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'label' | 'code';
export type TextWeight = 'normal' | 'bold' | 'black';
export type TextColor = 'primary' | 'secondary' | 'accent' | 'success' | 'danger' | 'warning';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
  children: ReactNode;
  className?: string;
}

export const Text = ({ 
  variant = 'body', 
  weight = 'normal',
  color = 'primary',
  children, 
  className = '',
  ...props 
}: TextProps) => {
  const classNames = `text text--${variant} text--${weight} text--${color} ${className}`;
  
  switch (variant) {
    case 'h1':
      return <h1 className={classNames} {...props}>{children}</h1>;
    case 'h2':
      return <h2 className={classNames} {...props}>{children}</h2>;
    case 'h3':
      return <h3 className={classNames} {...props}>{children}</h3>;
    case 'code':
      return <code className={classNames} {...props}>{children}</code>;
    case 'label':
      return <span className={classNames} {...props}>{children}</span>;
    case 'body':
    default:
      return <span className={classNames} {...props}>{children}</span>;
  }
};

