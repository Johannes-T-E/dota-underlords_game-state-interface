import { memo } from 'react';
import { HeroImage, StarIcon } from '../../atoms';
import type { HeroesData } from '../../../utils/heroHelpers';
import './HeroPortrait.css';

export interface HeroPortraitProps {
  unitId: number;
  rank: number;
  heroesData: HeroesData | null;
  className?: string;
}

export const HeroPortrait = memo(({ 
  unitId, 
  rank, 
  heroesData, 
  className = '' 
}: HeroPortraitProps) => {
  // Find hero by unit ID
  const findHeroByUnitId = (id: number): string => {
    if (!heroesData || !heroesData.heroes) {
      return 'npc_dota_hero_abaddon';
    }
    
    for (const [, heroData] of Object.entries(heroesData.heroes)) {
      if (heroData.id === id) {
        return heroData.dota_unit_name;
      }
    }
    
    return 'npc_dota_hero_abaddon'; // fallback
  };

  const dotaUnitName = findHeroByUnitId(unitId);
  const starLevel = Math.min(Math.max(rank, 0), 3);

  return (
    <div className={`hero-portrait ${className}`}>
      <HeroImage
        dotaUnitName={dotaUnitName}
        alt={`Unit ${unitId}`}
        size="medium"
        className="hero-portrait__image"
      />
      {starLevel > 0 && (
        <div className="hero-portrait__stars">
          {Array.from({ length: starLevel }, (_, i) => (
            <StarIcon
              key={i}
              rank={starLevel as 1 | 2 | 3}
              size="medium"
              className="hero-portrait__star"
            />
          ))}
        </div>
      )}
    </div>
  );
});

HeroPortrait.displayName = 'HeroPortrait';

