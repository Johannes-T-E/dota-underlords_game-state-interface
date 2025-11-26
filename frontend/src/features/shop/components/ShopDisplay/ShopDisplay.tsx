import { useMemo } from 'react';
import { HeroPortrait } from '@/components/ui';
import { EmptyState } from '@/components/shared';
import type { PrivatePlayerState, PlayerState } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import { calculatePoolCounts } from '@/utils/poolCalculator';
import './ShopDisplay.css';

export interface ShopDisplayProps {
  privatePlayer: PrivatePlayerState | null;
  players: PlayerState[];
  heroesData: HeroesData | null;
  selectedUnitIds?: Set<number>;
  onUnitClick?: (unitId: number) => void;
  className?: string;
}

export const ShopDisplay = ({
  privatePlayer,
  players,
  heroesData,
  selectedUnitIds = new Set<number>(),
  onUnitClick,
  className = ''
}: ShopDisplayProps) => {
  // Calculate pool counts for all heroes
  const poolCounts = useMemo(() => {
    return calculatePoolCounts(players, heroesData);
  }, [players, heroesData]);

  // Get shop units, ensuring we always have 5 slots
  const shopUnits = useMemo(() => {
    if (!privatePlayer || !privatePlayer.shop_units) {
      return Array(5).fill(null).map(() => ({ unit_id: -1 }));
    }
    
    const units = [...privatePlayer.shop_units];
    // Ensure we have exactly 5 slots
    while (units.length < 5) {
      units.push({ unit_id: -1 });
    }
    return units.slice(0, 5);
  }, [privatePlayer]);

  // Show empty state if no private player data
  if (!privatePlayer) {
    return (
      <div className={`shop-display ${className}`}>
        <EmptyState
          title="No Shop Data"
          message="Waiting for private player state..."
          showSpinner={false}
        />
      </div>
    );
  }

  return (
    <div className={`shop-display ${className}`}>
      <div className="shop-display__grid">
        {shopUnits.map((shopUnit, index) => {
          const unitId = shopUnit.unit_id;
          const isEmpty = unitId === -1;
          const isSelected = !isEmpty && selectedUnitIds.has(unitId);
          const isDimmed = selectedUnitIds.size > 0 && !isSelected && !isEmpty;
          
          const poolCount = !isEmpty ? poolCounts.get(unitId) : null;
          const poolText = poolCount 
            ? `${poolCount.remaining} / ${poolCount.total}`
            : '';

          return (
            <div
              key={index}
              className={`shop-display__slot ${
                isDimmed ? 'shop-display__slot--dimmed' : ''
              } ${isSelected ? 'shop-display__slot--selected' : ''} ${
                isEmpty ? 'shop-display__slot--empty' : ''
              }`}
              onClick={() => !isEmpty && onUnitClick?.(unitId)}
              style={!isEmpty ? { cursor: 'pointer' } : undefined}
            >
              {isEmpty ? (
                <div className="shop-display__empty-slot">
                  <div className="shop-display__empty-indicator" />
                </div>
              ) : (
                <HeroPortrait
                  unitId={unitId}
                  rank={0}
                  heroesData={heroesData}
                  className="shop-display__hero"
                />
              )}
              {!isEmpty && poolText && (
                <div className="shop-display__pool-count">
                  {poolText}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

