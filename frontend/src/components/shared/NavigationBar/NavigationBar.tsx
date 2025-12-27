import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Text, StatusIndicator, PhaseIcon, RoundStatus } from '@/components/ui';
import { useAppSelector } from '@/hooks/redux';
import './NavigationBar.css';

export interface NavigationBarProps {
  className?: string;
  onSettingsClick?: () => void;
}

export const NavigationBar = ({ className = '', onSettingsClick }: NavigationBarProps) => {
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

  const isActive = (path: string) => {
    if (path === '/heroes') {
      // Match /heroes and /heroes/:heroId
      return location.pathname === path || location.pathname.startsWith(path + '/');
    }
    if (path === '/items') {
      // Match /items and /items/:itemId
      return location.pathname === path || location.pathname.startsWith(path + '/');
    }
    return location.pathname === path;
  };

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
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`navigation-bar__toggle ${collapsed ? 'navigation-bar__toggle--collapsed' : ''}`}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <span className="navigation-bar__toggle-icon"></span>
        </button>
      </div>
      
      <div className="navigation-bar__links">
        <Link
          to="/dashboard"
          className={`navigation-bar__link ${isActive('/dashboard') ? 'navigation-bar__link--active' : ''}`}
          title="Dashboard"
        >
          <span className="navigation-bar__link-icon">DB</span>
          {!collapsed && <Text variant="body">Dashboard</Text>}
        </Link>
        <Link
          to="/match-management"
          className={`navigation-bar__link ${isActive('/match-management') ? 'navigation-bar__link--active' : ''}`}
          title="Match Management"
        >
          <span className="navigation-bar__link-icon">MT</span>
          {!collapsed && <Text variant="body">Matches</Text>}
        </Link>
        <Link
          to="/build-creator"
          className={`navigation-bar__link ${isActive('/build-creator') ? 'navigation-bar__link--active' : ''}`}
          title="Build Creator"
        >
          <span className="navigation-bar__link-icon">BC</span>
          {!collapsed && <Text variant="body">Build Creator</Text>}
        </Link>
        <Link
          to="/scoreboard"
          className={`navigation-bar__link ${isActive('/scoreboard') ? 'navigation-bar__link--active' : ''}`}
          title="Scoreboard"
        >
          <span className="navigation-bar__link-icon">SB</span>
          {!collapsed && <Text variant="body">Scoreboard</Text>}
        </Link>
        <Link
          to="/shop"
          className={`navigation-bar__link ${isActive('/shop') ? 'navigation-bar__link--active' : ''}`}
          title="Shop"
        >
          <span className="navigation-bar__link-icon">SH</span>
          {!collapsed && <Text variant="body">Shop</Text>}
        </Link>
        <Link
          to="/player-boards"
          className={`navigation-bar__link ${isActive('/player-boards') ? 'navigation-bar__link--active' : ''}`}
          title="Player Boards"
        >
          <span className="navigation-bar__link-icon">PB</span>
          {!collapsed && <Text variant="body">Player Boards</Text>}
        </Link>
        <Link
          to="/combat-results"
          className={`navigation-bar__link ${isActive('/combat-results') ? 'navigation-bar__link--active' : ''}`}
          title="Combat Results"
        >
          <span className="navigation-bar__link-icon">CR</span>
          {!collapsed && <Text variant="body">Combat Results</Text>}
        </Link>
        <Link
          to="/hero-pool-stats"
          className={`navigation-bar__link ${isActive('/hero-pool-stats') ? 'navigation-bar__link--active' : ''}`}
          title="Hero Pool Stats"
        >
          <span className="navigation-bar__link-icon">HP</span>
          {!collapsed && <Text variant="body">Hero Pool Stats</Text>}
        </Link>
        <Link
          to="/heroes"
          className={`navigation-bar__link ${isActive('/heroes') ? 'navigation-bar__link--active' : ''}`}
          title="Heroes"
        >
          <span className="navigation-bar__link-icon">HR</span>
          {!collapsed && <Text variant="body">Heroes</Text>}
        </Link>
        <Link
          to="/items"
          className={`navigation-bar__link ${isActive('/items') ? 'navigation-bar__link--active' : ''}`}
          title="Items"
        >
          <span className="navigation-bar__link-icon">IT</span>
          {!collapsed && <Text variant="body">Items</Text>}
        </Link>
      </div>

      {currentRound && (
        <div className="navigation-bar__round-info">
          {collapsed ? (
            <div className="navigation-bar__round-condensed" aria-label={`Round ${currentRound.round_number}`}>
              <Text variant="body" weight="bold">{currentRound.round_number}</Text>
              <PhaseIcon phase={currentRound.round_phase} size="small" />
            </div>
          ) : (
            <RoundStatus
              roundNumber={currentRound.round_number}
              roundPhase={currentRound.round_phase}
            />
          )}
        </div>
      )}

      <div className="navigation-bar__status">
        <StatusIndicator status={status} />
        {!collapsed && <Text variant="body">{getStatusText()}</Text>}
      </div>

      <div className="navigation-bar__actions">
        <Button
          variant="ghost"
          size="small"
          onClick={onSettingsClick}
          className="navigation-bar__settings-btn"
          aria-label="Open settings"
          title="Settings"
        >
          {collapsed ? (
            '⚙'
          ) : (
            <>
              <span aria-hidden>⚙</span>
              <Text variant="body">Settings</Text>
            </>
          )}
        </Button>
      </div>
    </nav>
  );
};

