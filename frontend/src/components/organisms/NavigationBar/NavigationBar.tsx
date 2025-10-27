import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Text, StatusIndicator, PhaseIcon } from '../../atoms';
import { useAppSelector } from '../../../hooks/redux';
import './NavigationBar.css';

export interface NavigationBarProps {
  className?: string;
}

export const NavigationBar = ({ className = '' }: NavigationBarProps) => {
  const location = useLocation();
  const { status } = useAppSelector((state) => state.connection);
  const { currentRound } = useAppSelector((state) => state.match);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('navCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('navCollapsed', collapsed.toString());
  }, [collapsed]);

  const isActive = (path: string) => location.pathname === path;

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <nav className={`navigation-bar ${collapsed ? 'navigation-bar--collapsed' : ''} ${className}`}>
      <div className="navigation-bar__header">
        <Button
          variant="ghost"
          size="small"
          onClick={toggleCollapsed}
          className="navigation-bar__toggle"
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▶' : '◀'}
        </Button>
        <Text variant="h2" weight="black" className="navigation-bar__title">
          {collapsed ? 'UL' : 'Underlords'}
        </Text>
      </div>
      
      <div className="navigation-bar__links">
        <Link
          to="/scoreboard"
          className={`navigation-bar__link ${isActive('/scoreboard') ? 'navigation-bar__link--active' : ''}`}
          title="Scoreboard"
        >
          <span className="navigation-bar__link-icon">SB</span>
          {!collapsed && <Text variant="body">Scoreboard</Text>}
        </Link>
        <Link
          to="/matches"
          className={`navigation-bar__link ${isActive('/matches') ? 'navigation-bar__link--active' : ''}`}
          title="Matches"
        >
          <span className="navigation-bar__link-icon">MT</span>
          {!collapsed && <Text variant="body">Matches</Text>}
        </Link>
      </div>

      {currentRound && (
        <div className="navigation-bar__round-info">
          <PhaseIcon phase={currentRound.round_phase} size="small" />
          {!collapsed && (
            <div className="navigation-bar__round-text">
              <Text variant="label" weight="bold">
                Round {currentRound.round_number}
              </Text>
              <Text variant="label" weight="normal">
                {currentRound.round_phase}
              </Text>
            </div>
          )}
        </div>
      )}

      <div className="navigation-bar__status">
        <StatusIndicator status={status} />
        {!collapsed && <Text variant="label">{getStatusText()}</Text>}
      </div>
    </nav>
  );
};

