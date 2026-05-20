import { useCallback, useMemo } from 'react';
import { HeroPortrait } from '@/components/ui';
import { PoolBarTooltipChart } from '@/components/charts/PoolBarChart/PoolBarTooltipChart';
import { computePoolBarTooltipMetrics } from '@/components/charts/PoolBarChart/poolBarTooltipMetrics';
import type { PoolBarStat } from '@/utils/poolBarStats';
import type { HeroesData } from '@/utils/heroHelpers';
import {
  buildOwnedHeroSegments,
  ownedHeroToBarStat,
} from '@/features/shop/utils/ownedHeroPoolSegments';
import './OwnedHeroesChart.css';

export interface OpponentOwnedSegment {
  playerSlot: number;
  count: number;
}

export interface OwnedHeroBarData {
  unitId: number;
  heroName: string;
  ownedCount: number;
  remainingPool: number;
  totalPool: number;
  opponentOwnedSegments: OpponentOwnedSegment[];
}

interface OwnedHeroesChartProps {
  heroesData: HeroesData | null;
  ownedHeroBars: OwnedHeroBarData[];
  /** @deprecated No longer used */
  maxOwnedTotalPool?: number;
  onUnitClick?: (unitId: number) => void;
}

export const OwnedHeroesChart = ({
  heroesData,
  ownedHeroBars,
  onUnitClick,
}: OwnedHeroesChartProps) => {
  const items = useMemo(
    () => ownedHeroBars.map((hero) => ownedHeroToBarStat(hero, heroesData)),
    [ownedHeroBars, heroesData]
  );

  const maxTotalPool = useMemo(() => {
    if (items.length === 0) return 1;
    return Math.max(...items.map((item) => item.totalPool));
  }, [items]);

  const metrics = useMemo(
    () => computePoolBarTooltipMetrics(maxTotalPool),
    [maxTotalPool]
  );

  const pipSegmentsByItemId = useMemo(() => {
    const map = new Map<string | number, string[]>();
    for (const hero of ownedHeroBars) {
      map.set(hero.unitId, buildOwnedHeroSegments(hero));
    }
    return map;
  }, [ownedHeroBars]);

  const renderLabel = useCallback(
    (item: PoolBarStat) => (
      <HeroPortrait
        unitId={Number(item.id)}
        rank={0}
        heroesData={heroesData}
      />
    ),
    [heroesData]
  );

  const handleItemClick = useCallback(
    (item: PoolBarStat) => {
      onUnitClick?.(Number(item.id));
    },
    [onUnitClick]
  );

  return (
    <div className="owned-heroes-chart">
      <div className="owned-heroes-chart__scroll app-scrollbar">
        <PoolBarTooltipChart
          items={items}
          metrics={metrics}
          renderLabel={renderLabel}
          pipSegmentsByItemId={pipSegmentsByItemId}
          onItemClick={onUnitClick ? handleItemClick : undefined}
          emptyMessage="No owned heroes yet"
        />
      </div>
    </div>
  );
};
