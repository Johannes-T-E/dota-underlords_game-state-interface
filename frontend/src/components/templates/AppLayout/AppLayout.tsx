import { ReactNode } from 'react';
import { NavigationBar } from '../../organisms';
import './AppLayout.css';

export interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export const AppLayout = ({ 
  children, 
  className = ''
}: AppLayoutProps) => {
  return (
    <div className={`app-layout ${className}`}>
      <NavigationBar />
      <div className="app-layout__main">
        <div className="app-layout__content">
          {children}
        </div>
      </div>
    </div>
  );
};

