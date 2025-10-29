import { HeroPortrait } from '../../molecules';
import { useUnitPositions } from '../../../hooks/useUnitPositions';
import type { Unit } from '../../../types';
import type { HeroesData } from '../../../utils/heroHelpers';
import './BenchGrid.css';

export interface BenchGridProps {
  units: Unit[];
  heroesData: HeroesData | null;
  className?: string;
}

export const BenchGrid = ({ units, heroesData, className = '' }: BenchGridProps) => {
  const animationStates = useUnitPositions(units);

  // Create 8x1 bench (y: -1, x: 0-7) - keep original structure
  const benchCells = [];
  for (let x = 0; x < 8; x++) {
    const unit = units.find(
      u => u.position && u.position.x === x && u.position.y === -1
    );

    benchCells.push(
      <div key={`bench-${x}`} className="bench-grid__cell" data-x={x} data-y="-1">
        {unit && (() => {
          // Check if this unit is currently animating or is new
            const animationState = animationStates.find(state => state.entindex === unit.entindex);
          const isUnitAnimating = animationState?.isMoving || false;
          const isUnitNew = animationState?.isNew || false;
          
          // Only show static unit if not animating and not new (new units are handled by animated overlay)
          return !isUnitAnimating && !isUnitNew ? (
            <HeroPortrait 
              unitId={unit.unit_id}
              rank={unit.rank || 0}
              heroesData={heroesData}
            />
          ) : null;
        })()}
      </div>
    );
  }

  return (
    <div className={`bench-grid ${className}`}>
      {/* Original grid structure */}
      {benchCells}
    </div>
  );
};

