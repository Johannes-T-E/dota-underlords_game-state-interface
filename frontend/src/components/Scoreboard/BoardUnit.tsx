import { memo } from 'react';
import { Unit } from '../../types';
import { getHeroIconPath, getStarIconPath } from '../../utils/heroHelpers';
import type { HeroesData } from '../../utils/heroHelpers';

interface BoardUnitProps {
  unit: Unit;
  heroesData: HeroesData | null;
}

export const BoardUnit = memo(({ unit, heroesData }: BoardUnitProps) => {
  const heroIconPath = getHeroIconPath(unit.unit_id, heroesData);
  const starLevel = unit.rank || 0;

  return (
    <div className="board-unit">
      <img
        src={heroIconPath}
        alt={`Unit ${unit.unit_id}`}
        className="board-hero-portrait"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/icons/hero_icons_scaled_56x56/npc_dota_hero_abaddon_png.png';
        }}
      />
      <div className="board-stars-container">
        <div className="board-star-list">
          {Array.from({ length: starLevel }, (_, i) => (
            <div
              key={i}
              className={`board-star-icon rank${Math.min(starLevel, 3)}`}
              style={{
                backgroundImage: `url(${getStarIconPath(starLevel)})`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
