import { memo } from 'react';
import { Unit } from '../../../types';
import { HeroPortrait } from '../HeroPortrait/HeroPortrait';
import type { HeroesData } from '../../../utils/heroHelpers';
import './BoardUnit.css';

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
