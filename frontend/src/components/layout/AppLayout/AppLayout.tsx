import { Outlet } from 'react-router-dom';
import { NavigationBar } from '@/components/shared';
import './AppLayout.css';

export interface AppLayoutProps {
  className?: string;
}

export const AppLayout = ({ className = '' }: AppLayoutProps) => {
  return (
    <div className={`app-layout ${className}`}>
      <NavigationBar />
      <div className="app-layout__main">
        <div className="app-layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
