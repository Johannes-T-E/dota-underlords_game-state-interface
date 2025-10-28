import { memo } from 'react';
import { HeroImage, StarIcon } from '../../atoms';
import type { HeroesData } from '../../../utils/heroHelpers';
import { getHeroTier, getTierGlowClass } from '../../../utils/heroHelpers';
import { useHeroPortraitSettings } from '../../../hooks/useSettings';
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
  const { settings } = useHeroPortraitSettings();
  
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
  
  // Calculate tier glow class if enabled (with defensive check)
  const tierGlowClass = settings?.enableTierGlow 
    ? getTierGlowClass(getHeroTier(unitId, heroesData))
    : '';

  // Get tier colors for dynamic styling
  const getTierColors = (tier: number) => {
    const tierColors = {
      1: { primary: '#595959', secondary: '#c8c8c8' },
      2: { primary: '#3b9208', secondary: '#65f013' },
      3: { primary: '#0c6583', secondary: '#14b4eb' },
      4: { primary: '#6a1e88', secondary: '#c151ec' },
      5: { primary: '#9b6714', secondary: '#f8ad33' }
    };
    return tierColors[tier as keyof typeof tierColors] || tierColors[1];
  };

  const tierColors = settings?.enableTierGlow 
    ? getTierColors(getHeroTier(unitId, heroesData))
    : undefined;

  return (
    <div className={`hero-portrait ${className}`}>
      <HeroImage
        dotaUnitName={dotaUnitName}
        alt={`Unit ${unitId}`}
        size="medium"
        className="hero-portrait__image"
        tierGlowClass={tierGlowClass}
        tierGlowConfig={settings?.tierGlowConfig}
        tierColors={tierColors}
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

