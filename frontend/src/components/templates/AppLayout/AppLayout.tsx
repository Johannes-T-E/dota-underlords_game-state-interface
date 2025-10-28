import { ReactNode, useState } from 'react';
import { NavigationBar } from '../../organisms';
import { SettingsDrawer } from '../../organisms/SettingsDrawer/SettingsDrawer';
import './AppLayout.css';

export interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export const AppLayout = ({ 
  children, 
  className = ''
}: AppLayoutProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  return (
    <div className={`app-layout ${className}`}>
      <NavigationBar onSettingsClick={handleSettingsClick} />
      <div className="app-layout__main">
        <div className="app-layout__content">
          {children}
        </div>
      </div>
      <SettingsDrawer isOpen={isSettingsOpen} onClose={handleSettingsClose} />
    </div>
  );
};

