import { CSSProperties, ReactNode } from 'react';
import './SidebarLayoutTemplate.css';

export interface SidebarLayoutTemplateProps {
  sidebar: ReactNode;
  main: ReactNode;
  sidebarWidth?: string;
  className?: string;
}

export const SidebarLayoutTemplate = ({ 
  sidebar, 
  main, 
  sidebarWidth = '500px',
  className = ''
}: SidebarLayoutTemplateProps) => {
  return (
    <div
      className={`sidebar-layout-template ${className}`}
      style={{ '--sidebar-width': sidebarWidth } as CSSProperties}
    >
      <div className="sidebar-layout-template__sidebar">
        {sidebar}
      </div>
      <div className="sidebar-layout-template__main">
        {main}
      </div>
    </div>
  );
};

