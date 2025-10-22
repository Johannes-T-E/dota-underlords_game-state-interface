import { memo } from 'react';
import { Unit } from '../../types';
import { HeroPortrait } from './HeroPortrait';
import type { HeroesData } from '../../utils/heroHelpers';

interface BoardUnitProps {
  unit: Unit;
  heroesData: HeroesData | null;
}

export const BoardUnit = memo(({ unit, heroesData }: BoardUnitProps) => {
  return (
    <div className="board-unit">
      <HeroPortrait 
        unitId={unit.unit_id}
        rank={unit.rank || 0}
        heroesData={heroesData}
      />
    </div>
  );
});
