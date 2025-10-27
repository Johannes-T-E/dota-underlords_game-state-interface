import { memo } from 'react';
import { HeroImage, StarIcon } from '../../atoms';
import type { HeroesData } from '../../../utils/heroHelpers';
import './HeroPortrait.css';

export interface HeroPortraitProps {
  unitId: number;
  rank: number;
  heroesData: HeroesData | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const HeroPortrait = memo(({ 
  unitId, 
  rank, 
  heroesData, 
  size = 'medium',
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
    <div className={`hero-portrait hero-portrait--${size} ${className}`}>
      <HeroImage
        dotaUnitName={dotaUnitName}
        alt={`Unit ${unitId}`}
        size={size}
        className="hero-portrait__image"
      />
      {starLevel > 0 && (
        <div className="hero-portrait__stars">
          {Array.from({ length: starLevel }, (_, i) => (
            <StarIcon
              key={i}
              rank={starLevel as 1 | 2 | 3}
              size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'medium'}
              className="hero-portrait__star"
            />
          ))}
        </div>
      )}
    </div>
  );
});

HeroPortrait.displayName = 'HeroPortrait';

