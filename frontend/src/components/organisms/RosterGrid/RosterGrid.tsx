import { HeroPortrait } from '../../molecules';
import type { Unit } from '../../../types';
import type { HeroesData } from '../../../utils/heroHelpers';
import './RosterGrid.css';

export interface RosterGridProps {
  units: Unit[];
  heroesData: HeroesData | null;
  className?: string;
}

export const RosterGrid = ({ units, heroesData, className = '' }: RosterGridProps) => {
  // Create 8x4 grid (y: 0-3, x: 0-7)
  const gridCells = [];
  for (let y = 3; y >= 0; y--) { // Top to bottom (y=3 to y=0)
    for (let x = 0; x < 8; x++) {
      const unit = units.find(
        u => u.position && u.position.x === x && u.position.y === y
      );

      gridCells.push(
        <div key={`${x}-${y}`} className="roster-grid__cell" data-x={x} data-y={y}>
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
  }

  return (
    <div className={`roster-grid ${className}`}>
      {gridCells}
    </div>
  );
};

