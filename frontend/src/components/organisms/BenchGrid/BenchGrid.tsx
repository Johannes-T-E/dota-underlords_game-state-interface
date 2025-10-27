import { HeroPortrait } from '../../molecules';
import type { Unit } from '../../../types';
import type { HeroesData } from '../../../utils/heroHelpers';
import './BenchGrid.css';

export interface BenchGridProps {
  units: Unit[];
  heroesData: HeroesData | null;
  className?: string;
}

export const BenchGrid = ({ units, heroesData, className = '' }: BenchGridProps) => {
  // Create 8x1 bench (y: -1, x: 0-7)
  const benchCells = [];
  for (let x = 0; x < 8; x++) {
    const unit = units.find(
      u => u.position && u.position.x === x && u.position.y === -1
    );

    benchCells.push(
      <div key={`bench-${x}`} className="bench-grid__cell" data-x={x} data-y="-1">
        {unit && (
          <HeroPortrait 
            unitId={unit.unit_id}
            rank={unit.rank || 0}
            heroesData={heroesData}
            size="medium"
          />
        )}
      </div>
    );
  }

  return (
    <div className={`bench-grid ${className}`}>
      {benchCells}
    </div>
  );
};

