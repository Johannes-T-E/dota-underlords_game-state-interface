import { type CSSProperties } from 'react';
import { HeroPortrait } from '@/components/ui';
import type { HeroesData } from '@/utils/heroHelpers';
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
  maxOwnedTotalPool: number;
  onUnitClick?: (unitId: number) => void;
}

export const OwnedHeroesChart = ({
  heroesData,
  ownedHeroBars,
  maxOwnedTotalPool,
  onUnitClick
}: OwnedHeroesChartProps) => {
  return (
    <div
      className="shop-display__owned-chart app-scrollbar"
      style={
        {
          '--shop-owned-max-pips': Math.max(maxOwnedTotalPool, 1)
        } as CSSProperties
      }
    >
      {ownedHeroBars.length > 0 ? (
        ownedHeroBars.map((hero) => {
          const totalPool = Math.max(hero.totalPool, 1);
          const remainingPool = Math.max(0, Math.min(Math.floor(hero.remainingPool), totalPool));
          const ownedCount = Math.max(
            0,
            Math.min(Math.floor(hero.ownedCount), totalPool - remainingPool)
          );
          const maxOpponentOwned = Math.max(0, totalPool - remainingPool - ownedCount);
          const rawOpponentSum = hero.opponentOwnedSegments.reduce(
            (sum, segment) => sum + segment.count,
            0
          );
          const normalizedOpponentSegments =
            rawOpponentSum <= maxOpponentOwned || rawOpponentSum === 0
              ? hero.opponentOwnedSegments.map((segment) => ({ ...segment }))
              : hero.opponentOwnedSegments.map((segment) => ({
                  ...segment,
                  count: Math.floor((segment.count / rawOpponentSum) * maxOpponentOwned)
                }));
          let allocatedOpponentPips = normalizedOpponentSegments.reduce(
            (sum, segment) => sum + segment.count,
            0
          );
          const opponentSegmentsWithRemainder = [...normalizedOpponentSegments];
          let i = 0;
          while (
            allocatedOpponentPips < maxOpponentOwned &&
            opponentSegmentsWithRemainder.length > 0
          ) {
            const idx = i % opponentSegmentsWithRemainder.length;
            const currentSegment = opponentSegmentsWithRemainder[idx];
            if (currentSegment) {
              currentSegment.count += 1;
            }
            allocatedOpponentPips += 1;
            i += 1;
          }

          const barWidthPercent = (totalPool / maxOwnedTotalPool) * 100;
          const opponentPips = opponentSegmentsWithRemainder.flatMap((segment) =>
            Array.from(
              { length: segment.count },
              () => `opponent-slot-${Math.abs(segment.playerSlot) % 8}`
            )
          );
          const pipSegments = [
            ...Array.from({ length: ownedCount }, () => 'private'),
            ...Array.from({ length: remainingPool }, () => 'unowned'),
            ...opponentPips
          ];

          return (
            <div
              key={`owned-bar-${hero.unitId}`}
              className="shop-display__owned-bar-item"
              title={`${hero.heroName}: ${remainingPool}/${hero.totalPool} in pool, ${hero.ownedCount} owned`}
              onClick={() => onUnitClick?.(hero.unitId)}
            >
              <div className="shop-display__owned-label">
                <div className="shop-display__owned-label-text">
                  {remainingPool}/{hero.totalPool}
                </div>
                <HeroPortrait
                  unitId={hero.unitId}
                  rank={0}
                  heroesData={heroesData}
                  className="shop-display__owned-label-portrait"
                />
              </div>
              <div className="shop-display__owned-bar-container">
                <div
                  className="shop-display__owned-bar"
                  style={{
                    width: `${barWidthPercent}%`,
                    borderColor: 'var(--border-color, #3a3a3e)',
                    gridTemplateColumns: `repeat(${Math.max(totalPool, 1)}, minmax(0, 1fr))`
                  }}
                >
                  {pipSegments.map((segment, pipIndex) => (
                    <div
                      key={`owned-pip-${hero.unitId}-${pipIndex}`}
                      className={`shop-display__owned-pip shop-display__owned-pip--${segment}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="shop-display__owned-empty">No owned heroes yet</div>
      )}
    </div>
  );
};
