import { useMemo, useState, useCallback } from 'react';
import { MainContentTemplate } from '@/components/layout';
import { PoolBarChart } from '@/components/charts/PoolBarChart';
import { SynergyIcon } from '@/components/ui/SynergyDisplay';
import { EmptyState, PageHeader } from '@/components/shared';
import { IconChartBar } from '@tabler/icons-react';
import { useAppSelector } from '@/hooks/redux';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
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
import { HeroPortrait } from '@/components/ui';
import '@/components/ui/SynergyDisplay/synergy-colors.css';
import './HeroPoolStatsPage.css';

export type PoolViewMode = 'synergy' | 'tier';

export const HeroPoolStatsPage = () => {
  const { currentMatch, players } = useAppSelector((state) => state.match);
  const { heroesData } = useHeroesDataContext();
  const [viewMode, setViewMode] = useState<PoolViewMode>('synergy');

  const poolCounts = useMemo(() => {
    if (!players || !heroesData) {
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

  const hasPoolData = viewMode === 'tier'
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
      <MainContentTemplate centered={false} className="hero-pool-stats-page">
        <div className="hero-pool-stats-page__container">
          <PageHeader
            title="Hero Pool Stats"
            icon={<IconChartBar size={18} stroke={1.8} />}
            rightContent={
              <div className="hero-pool-stats-page__view-toggle">
                <button
                  type="button"
                  className={`hero-pool-stats-page__view-button ${viewMode === 'synergy' ? 'hero-pool-stats-page__view-button--active' : ''}`}
                  onClick={() => setViewMode('synergy')}
                >
                  Synergy
                </button>
                <button
                  type="button"
                  className={`hero-pool-stats-page__view-button ${viewMode === 'tier' ? 'hero-pool-stats-page__view-button--active' : ''}`}
                  onClick={() => setViewMode('tier')}
                >
                  Tier
                </button>
              </div>
            }
          />
          {!currentMatch ? (
            <div className="hero-pool-stats-page__empty">
              <EmptyState
                title="No Active Match"
                message="Waiting for GSI data from Dota Underlords..."
                showSpinner
              />
            </div>
          ) : !hasPoolData ? (
            <div className="hero-pool-stats-page__empty">
              <EmptyState
                title="No Pool Data Available"
                message={
                  viewMode === 'tier'
                    ? 'No tier pool statistics available for current match.'
                    : 'No synergy pool statistics available for current match.'
                }
                showSpinner={false}
              />
            </div>
          ) : (
            <div className="hero-pool-stats-page__chart-section">
              <PoolBarChart
                items={chartItems}
                renderLabel={renderLabel}
                renderTooltipLabel={renderTooltipLabel}
                emptyMessage={emptyMessage}
                tooltipEnabled={viewMode === 'synergy'}
                heroBreakdownByItemId={synergyHeroBreakdownMap}
              />
            </div>
          )}
        </div>
      </MainContentTemplate>
  );
};
