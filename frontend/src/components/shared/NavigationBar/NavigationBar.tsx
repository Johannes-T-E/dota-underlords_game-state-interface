import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  IconArrowsShuffle,
  IconBolt,
  IconChartBar,
  IconChalkboardTeacher,
  IconDashboard,
  IconDatabase,
  IconGoGame,
  IconScoreboard,
  IconSettings,
  IconShoppingCart,
  IconSock,
  IconSpy,
  IconTrophy,
  IconUsersGroup,
} from '@tabler/icons-react';
import { Text, StatusIndicator } from '@/components/ui';
import { useAppSelector } from '@/hooks/redux';
import { extractBenchUnits, buildTargetBench, organizeBench } from '@/utils/benchSort';
import { selectBenchOrganizeTimings, selectBenchRankDirection } from '@/store/settingsSlice';
import './NavigationBar.css';

export interface NavigationBarProps {
  className?: string;
}

export const NavigationBar = ({ className = '' }: NavigationBarProps) => {
  const location = useLocation();
  const { status, currentMatch, players, privatePlayerAccountId } = useAppSelector((state) => ({
    status: state.connection.status,
    currentMatch: state.match.currentMatch,
    players: state.match.players,
    privatePlayerAccountId: state.match.privatePlayerAccountId,
  }));
  const benchTimings = useAppSelector(selectBenchOrganizeTimings);
  const benchRankDirection = useAppSelector(selectBenchRankDirection);
  const [isHovered, setIsHovered] = useState(false);
  const [isQuickSorting, setIsQuickSorting] = useState(false);
  const collapsed = !isHovered;

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

  const handleQuickBenchSort = async () => {
    if (isQuickSorting) return;
    const privatePlayer = players.find((p) => p.account_id === privatePlayerAccountId) ?? null;
    if (!currentMatch || !privatePlayer) {
      console.warn('[Bench] No active match or player state yet.');
      return;
    }
    const bench = extractBenchUnits(privatePlayer.units);
    if (bench.length < 2) {
      console.warn('[Bench] Need at least two bench units to sort.');
      return;
    }
    const targetBench = buildTargetBench(bench, benchRankDirection);
    setIsQuickSorting(true);
    try {
      const result = await organizeBench({
        targetBench,
        timings: benchTimings,
        dryRun: false,
      });
      console.log('[Bench] Sort complete.', { moves: result.moves_executed });
    } catch (e) {
      console.error('[Bench] Sort failed:', e instanceof Error ? e.message : e);
    } finally {
      setIsQuickSorting(false);
    }
  };

  return (
    <nav
      className={`navigation-bar ${collapsed ? 'navigation-bar--collapsed' : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsHovered(true)}
      onBlurCapture={(event) => {
        const nextFocused = event.relatedTarget as Node | null;
        if (!event.currentTarget.contains(nextFocused)) {
          setIsHovered(false);
        }
      }}
    >
      <div className="navigation-bar__header">
      </div>
      
      <div className="navigation-bar__links app-scrollbar">
        <div className="navigation-bar__link navigation-bar__status--inline">
          <span className="navigation-bar__link-icon navigation-bar__status-icon">
            <StatusIndicator status={status} />
          </span>
          {!collapsed && <Text variant="body">{getStatusText()}</Text>}
        </div>
        <Link
          to="/dashboard"
          className={`navigation-bar__link ${isActive('/dashboard') ? 'navigation-bar__link--active' : ''}`}
          title="Dashboard"
        >
          <span className="navigation-bar__link-icon"><IconDashboard size={18} stroke={1.8} /></span>
          {!collapsed && <Text variant="body">Dashboard</Text>}
        </Link>
        <Link
          to="/matchup-predictor"
          className={`navigation-bar__link ${isActive('/matchup-predictor') ? 'navigation-bar__link--active' : ''}`}
          title="Opponent Forecast"
        >
          <span className="navigation-bar__link-icon"><IconSpy size={18} stroke={1.8} /></span>
          {!collapsed && <Text variant="body">Opponent Forecast</Text>}
        </Link>
        <Link
          to="/hero-pool-stats"
          className={`navigation-bar__link ${isActive('/hero-pool-stats') ? 'navigation-bar__link--active' : ''}`}
          title="Hero Pool Stats"
        >
          <span className="navigation-bar__link-icon"><IconChartBar size={18} stroke={1.8} /></span>
          {!collapsed && <Text variant="body">Hero Pool Stats</Text>}
        </Link>
        <Link
          to="/shop"
          className={`navigation-bar__link ${isActive('/shop') ? 'navigation-bar__link--active' : ''}`}
          title="Shop"
        >
          <span className="navigation-bar__link-icon"><IconShoppingCart size={18} stroke={1.8} /></span>
          {!collapsed && <Text variant="body">Shop</Text>}
        </Link>
        <Link
          to="/match-management"
          className={`navigation-bar__link ${isActive('/match-management') ? 'navigation-bar__link--active' : ''}`}
          title="Match Management"
        >
          <span className="navigation-bar__link-icon"><IconDatabase size={18} stroke={1.8} /></span>
          {!collapsed && <Text variant="body">Matches</Text>}
        </Link>
        <Link
          to="/combat-results"
          className={`navigation-bar__link ${isActive('/combat-results') ? 'navigation-bar__link--active' : ''}`}
          title="Combat Results"
        >
          <span className="navigation-bar__link-icon"><IconTrophy size={18} stroke={1.8} /></span>
          {!collapsed && <Text variant="body">Combat Results</Text>}
        </Link>
        <Link
          to="/build-creator"
          className={`navigation-bar__link ${isActive('/build-creator') ? 'navigation-bar__link--active' : ''}`}
          title="Build Creator"
        >
          <span className="navigation-bar__link-icon"><IconChalkboardTeacher size={18} stroke={1.8} /></span>
          {!collapsed && <Text variant="body">Build Creator</Text>}
        </Link>
        <Link
          to="/scoreboard"
          className={`navigation-bar__link ${isActive('/scoreboard') ? 'navigation-bar__link--active' : ''}`}
          title="Scoreboard"
        >
          <span className="navigation-bar__link-icon"><IconScoreboard size={18} stroke={1.8} /></span>
          {!collapsed && <Text variant="body">Scoreboard</Text>}
        </Link>
        <Link
          to="/player-boards"
          className={`navigation-bar__link ${isActive('/player-boards') ? 'navigation-bar__link--active' : ''}`}
          title="Player Boards"
        >
          <span className="navigation-bar__link-icon"><IconGoGame size={18} stroke={1.8} /></span>
          {!collapsed && <Text variant="body">Player Boards</Text>}
        </Link>
        <Link
          to="/heroes"
          className={`navigation-bar__link ${isActive('/heroes') ? 'navigation-bar__link--active' : ''}`}
          title="Heroes"
        >
          <span className="navigation-bar__link-icon"><IconUsersGroup size={18} stroke={1.8} /></span>
          {!collapsed && <Text variant="body">Heroes</Text>}
        </Link>
        <Link
          to="/items"
          className={`navigation-bar__link ${isActive('/items') ? 'navigation-bar__link--active' : ''}`}
          title="Items"
        >
          <span className="navigation-bar__link-icon"><IconSock size={18} stroke={1.8} /></span>
          {!collapsed && <Text variant="body">Items</Text>}
        </Link>
        <Link
          to="/settings"
          className={`navigation-bar__link ${isActive('/settings') ? 'navigation-bar__link--active' : ''}`}
          aria-label="Open settings"
          title="Settings"
        >
          <span className="navigation-bar__link-icon" aria-hidden>
            <IconSettings size={18} stroke={1.8} />
          </span>
          {!collapsed && <Text variant="body">Settings</Text>}
        </Link>

        <div className="navigation-bar__bottom-actions">
          <Link
            to="/bench-sorter"
            className={`navigation-bar__link ${isActive('/bench-sorter') ? 'navigation-bar__link--active' : ''}`}
            title="Bench Sorter"
          >
            <span className="navigation-bar__link-icon" aria-hidden>
              <IconArrowsShuffle size={18} stroke={1.8} />
            </span>
            {!collapsed && <Text variant="body">Bench Sorter</Text>}
          </Link>
          <button
            type="button"
            className="navigation-bar__link"
            title="Sort bench now (uses Bench Sorter settings)"
            onClick={handleQuickBenchSort}
            disabled={isQuickSorting}
          >
            <span className="navigation-bar__link-icon" aria-hidden>
              <IconBolt size={18} stroke={1.8} />
            </span>
            {!collapsed && <Text variant="body">{isQuickSorting ? 'Sorting…' : 'Sort bench'}</Text>}
          </button>
        </div>
      </div>
    </nav>
  );
};

