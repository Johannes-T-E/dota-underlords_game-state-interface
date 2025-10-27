import { ReactNode } from 'react';
import './MainContentTemplate.css';

export interface MainContentTemplateProps {
  children: ReactNode;
  maxWidth?: string;
  centered?: boolean;
  className?: string;
}

export const MainContentTemplate = ({ 
  children, 
  maxWidth = 'none',
  centered = true,
  className = ''
}: MainContentTemplateProps) => {
  return (
    <div 
      className={`main-content-template ${centered ? 'main-content-template--centered' : ''} ${className}`}
      style={{ maxWidth }}
    >
      {children}
    </div>
  );
};

