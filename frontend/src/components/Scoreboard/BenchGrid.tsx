import { BoardUnit } from './BoardUnit';
import { Unit } from '../../types';
import type { HeroesData } from '../../utils/heroHelpers';

interface BenchGridProps {
  units: Unit[];
  heroesData: HeroesData | null;
}

export const BenchGrid = ({ units, heroesData }: BenchGridProps) => {
  // Create 8x1 bench (y: -1, x: 0-7)
  const benchCells = [];
  for (let x = 0; x < 8; x++) {
    benchCells.push(
      <div key={`bench-${x}`} className="bench-cell" data-x={x} data-y="-1">
        {units
          .filter(unit => unit.position && unit.position.x === x && unit.position.y === -1)
          .map((unit, idx) => (
            <BoardUnit key={`${unit.unit_id}-${idx}`} unit={unit} heroesData={heroesData} />
          ))
        }
      </div>
    );
  }

  return (
    <div className="bench-grid">
      {benchCells}
    </div>
  );
};
