import { useCallback, useMemo } from 'react';
import { HeroPortrait } from '@/components/ui';
import {
  PoolBarChart,
  POOL_BAR_MAIN_LABEL_HEIGHT_PX,
  POOL_BAR_TOOLTIP_PX_PER_POOL_UNIT,
} from '@/components/charts/PoolBarChart';
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
  /** @deprecated No longer used; pip height matches hero pool tooltip (4px per unit) */
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
        <PoolBarChart
          className="pool-bar-chart--tooltip pool-bar-chart--owned-heroes"
          items={items}
          renderLabel={renderLabel}
          pixelsPerPoolUnit={POOL_BAR_TOOLTIP_PX_PER_POOL_UNIT}
          labelHeightPx={POOL_BAR_MAIN_LABEL_HEIGHT_PX}
          pipSegmentsByItemId={pipSegmentsByItemId}
          onItemClick={onUnitClick ? handleItemClick : undefined}
          emptyMessage="No owned heroes yet"
        />
      </div>
    </div>
  );
};
