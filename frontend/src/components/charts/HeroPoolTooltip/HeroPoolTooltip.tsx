import { useMemo, type ReactNode } from 'react';
import { HoverTooltip } from '@/components/ui/HoverTooltip/HoverTooltip';
import type { HeroesData } from '@/utils/heroHelpers';
import type { PoolCount } from '@/utils/poolCalculator';
import { getHeroPoolBarStat } from '@/utils/poolBarStats';
import './HeroPoolTooltip.css';

export interface HeroPoolTooltipProps {
  unitId: number;
  heroesData: HeroesData | null;
  poolCounts?: Map<number, PoolCount>;
  children: ReactNode;
  disabled?: boolean;
}

export const HeroPoolTooltip = ({
  unitId,
  heroesData,
  poolCounts,
  children,
  disabled = false,
}: HeroPoolTooltipProps) => {
  const barStat = useMemo(
    () => getHeroPoolBarStat(unitId, heroesData, poolCounts),
    [unitId, heroesData, poolCounts]
  );

  if (!barStat || disabled) {
    return <>{children}</>;
  }

  return (
    <HoverTooltip
      followCursor
      content={
        <span className="hero-pool-tooltip__text">
          {barStat.remainingPool} / {barStat.totalPool}
        </span>
      }
    >
      {children}
    </HoverTooltip>
  );
};
