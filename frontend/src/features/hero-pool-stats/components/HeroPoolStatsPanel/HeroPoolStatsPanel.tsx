import { useMemo, useState, useCallback } from 'react';
import { PoolBarChart } from '@/components/charts/PoolBarChart';
import { SynergyIcon } from '@/components/ui/SynergyDisplay';
import { HeroPortrait } from '@/components/ui';
import { calculatePoolCounts } from '@/utils/poolCalculator';
import { calculateSynergyPoolStats } from '@/utils/synergyPoolCalculator';
import { calculateSynergyHeroPoolStats } from '@/utils/synergyHeroPoolCalculator';
import { calculateTierPoolStats } from '@/utils/tierPoolCalculator';
import {
  synergyStatToBarStat,
  tierStatToBarStat,
  heroPoolStatToBarStat,
  getSynergyVisualData,
  getTierCostLabel,
  type PoolBarStat,
} from '@/utils/poolBarStats';
import type { PlayerState } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import type { PoolViewMode } from '../../HeroPoolStatsPage';
import '@/components/ui/SynergyDisplay/synergy-colors.css';
import './HeroPoolStatsPanel.css';

export interface HeroPoolStatsPanelProps {
  players: PlayerState[];
  heroesData: HeroesData | null;
  className?: string;
  viewMode?: PoolViewMode;
  onViewModeChange?: (mode: PoolViewMode) => void;
  /** Show Synergy / Tier toggle in the panel header (dashboard embed). */
  showViewToggle?: boolean;
  /**
   * Dashboard embed: proportional bar fill instead of one pip per copy.
   * Full-page hero pool stats should leave this off.
   */
  aggregateBarFill?: boolean;
}

export const HeroPoolStatsPanel = ({
  players,
  heroesData,
  className = '',
  viewMode: viewModeProp,
  onViewModeChange,
  showViewToggle = false,
  aggregateBarFill = false,
}: HeroPoolStatsPanelProps) => {
  const [internalViewMode, setInternalViewMode] = useState<PoolViewMode>('synergy');
  const viewMode = viewModeProp ?? internalViewMode;
  const setViewMode = onViewModeChange ?? setInternalViewMode;

  const poolCounts = useMemo(() => {
    if (!players.length || !heroesData) {
      return new Map();
    }
    return calculatePoolCounts(players, heroesData);
  }, [players, heroesData]);

  const synergyPoolStats = useMemo(() => {
    if (!heroesData || poolCounts.size === 0) {
      return [];
    }
    return calculateSynergyPoolStats(heroesData, poolCounts);
  }, [heroesData, poolCounts]);

  const tierPoolStats = useMemo(() => {
    if (!heroesData || poolCounts.size === 0) {
      return [];
    }
    return calculateTierPoolStats(heroesData, poolCounts);
  }, [heroesData, poolCounts]);

  const chartItems = useMemo(() => {
    if (viewMode === 'tier') {
      return tierPoolStats.map(tierStatToBarStat);
    }
    return synergyPoolStats.map(synergyStatToBarStat);
  }, [viewMode, synergyPoolStats, tierPoolStats]);

  const synergyHeroBreakdownMap = useMemo(() => {
    const map = new Map<number, PoolBarStat[]>();
    if (!heroesData || poolCounts.size === 0) {
      return map;
    }
    for (const stat of synergyPoolStats) {
      const heroes = calculateSynergyHeroPoolStats(
        stat.keyword,
        heroesData,
        poolCounts
      );
      if (heroes.length > 0) {
        map.set(stat.keyword, heroes.map(heroPoolStatToBarStat));
      }
    }
    return map;
  }, [heroesData, poolCounts, synergyPoolStats]);

  const hasPoolData =
    viewMode === 'tier'
      ? tierPoolStats.some((s) => s.totalPool > 0)
      : synergyPoolStats.length > 0;

  const renderLabel = useCallback((item: PoolBarStat) => {
    if (item.tier != null) {
      return (
        <span
          className="pool-bar-chart__tier-badge"
          style={{ color: item.color, borderColor: item.color }}
        >
          {getTierCostLabel(item.tier)}
        </span>
      );
    }

    const synergyName = item.synergyName ?? item.label;
    const visual = getSynergyVisualData(synergyName);
    return (
      <SynergyIcon
        styleNumber={visual.styleNumber}
        iconFile={visual.iconFile}
        synergyName={synergyName}
        synergyColor={visual.synergyColor}
        brightColor={visual.brightColor}
      />
    );
  }, []);

  const renderTooltipLabel = useCallback(
    (item: PoolBarStat) => (
      <HeroPortrait
        unitId={Number(item.id)}
        rank={0}
        heroesData={heroesData}
      />
    ),
    [heroesData]
  );

  const emptyMessage =
    viewMode === 'tier'
      ? 'No tier pool data available'
      : 'No synergy pool data available';

  return (
    <div className={`hero-pool-stats-panel ${className}`}>
      {showViewToggle && (
        <div className="hero-pool-stats-panel__toolbar">
          <div className="hero-pool-stats-panel__view-toggle">
            <button
              type="button"
              className={`hero-pool-stats-panel__view-button ${
                viewMode === 'synergy'
                  ? 'hero-pool-stats-panel__view-button--active'
                  : ''
              }`}
              onClick={() => setViewMode('synergy')}
            >
              Synergy
            </button>
            <button
              type="button"
              className={`hero-pool-stats-panel__view-button ${
                viewMode === 'tier'
                  ? 'hero-pool-stats-panel__view-button--active'
                  : ''
              }`}
              onClick={() => setViewMode('tier')}
            >
              Tier
            </button>
          </div>
        </div>
      )}

      <div className="hero-pool-stats-panel__chart app-scrollbar">
        {!hasPoolData ? (
          <p className="hero-pool-stats-panel__empty">{emptyMessage}</p>
        ) : (
          <PoolBarChart
            items={chartItems}
            renderLabel={renderLabel}
            renderTooltipLabel={renderTooltipLabel}
            emptyMessage={emptyMessage}
            tooltipEnabled={viewMode === 'synergy'}
            heroBreakdownByItemId={synergyHeroBreakdownMap}
            showLabelText={viewMode === 'tier'}
            barFillMode={aggregateBarFill ? 'aggregate' : 'per-copy'}
          />
        )}
      </div>
    </div>
  );
};
