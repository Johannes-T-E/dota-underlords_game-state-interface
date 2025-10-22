import { BoardUnit } from '../BoardUnit/BoardUnit';
import { Unit } from '../../../types';
import type { HeroesData } from '../../../utils/heroHelpers';
import './BoardGrid.css';

interface BoardGridProps {
  units: Unit[];
  heroesData: HeroesData | null;
}

export const BoardGrid = ({ units, heroesData }: BoardGridProps) => {
  // Create 8x4 grid (y: 0-3, x: 0-7)
  const gridCells = [];
  for (let y = 3; y >= 0; y--) { // Top to bottom (y=3 to y=0)
    for (let x = 0; x < 8; x++) {
      gridCells.push(
        <div key={`${x}-${y}`} className="board-cell" data-x={x} data-y={y}>
          {units
            .filter(unit => unit.position && unit.position.x === x && unit.position.y === y)
            .map((unit, idx) => (
              <BoardUnit key={`${unit.unit_id}-${idx}`} unit={unit} heroesData={heroesData} />
            ))
          }
        </div>
      );
    }
  }

  return (
    <div className="board-grid">
      {gridCells}
    </div>
  );
};
