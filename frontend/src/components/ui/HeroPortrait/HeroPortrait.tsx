import { memo, useMemo } from 'react';
import { HeroImage } from './components/HeroImage/HeroImage';
import { StarIcon } from './components/StarIcon/StarIcon';
import type { HeroesData } from '@/utils/heroHelpers';
import { getHeroTier, getTierGlowClass } from '@/utils/heroHelpers';
import { useHeroPortraitSettings } from '@/hooks/useSettings';
import type { ItemSlot } from '@/types';
import type { ItemsData } from '@/utils/itemHelpers';
import { findEquippedItem } from '@/utils/itemHelpers';
import './HeroPortrait.css';

export interface HeroPortraitProps {
  unitId: number;
  rank: number;
  heroesData: HeroesData | null;
  className?: string;
  tierColors?: {
    primary: string;
    secondary: string;
  }; // Optional: override tier colors (e.g., for synergy selection)
  entindex?: number; // Unit entity index for item matching
  itemSlots?: ItemSlot[]; // Array of item slots from player state
  itemsData?: ItemsData | null; // Items.json data for icon lookup
}

// Get tier colors for dynamic styling - moved outside component to avoid redefinition
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

// Find hero by unit ID - moved outside component to avoid redefinition
const findHeroByUnitId = (id: number, heroesData: HeroesData | null): string => {
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

export const HeroPortrait = memo(({ 
  unitId, 
  rank, 
  heroesData, 
  className = '',
  tierColors: overrideTierColors,
  entindex,
  itemSlots,
  itemsData
}: HeroPortraitProps) => {
  const { settings } = useHeroPortraitSettings();
  
  // Memoize equipped item icon path - expensive lookup
  const itemIconPath = useMemo(() => {
    return findEquippedItem(entindex, itemSlots, itemsData ?? null);
  }, [entindex, itemSlots, itemsData]);
  
  // Memoize hero tier - used multiple times, calculate once
  const heroTier = useMemo(() => {
    return getHeroTier(unitId, heroesData);
  }, [unitId, heroesData]);
  
  // Memoize dota unit name - expensive lookup
  const dotaUnitName = useMemo(() => {
    return findHeroByUnitId(unitId, heroesData);
  }, [unitId, heroesData]);
  
  const starLevel = Math.min(Math.max(rank, 0), 3);
  
  // Memoize tier colors calculation
  const tierColors = useMemo(() => {
    return overrideTierColors || (settings?.enableTierGlow 
      ? getTierColors(heroTier)
      : undefined);
  }, [overrideTierColors, settings?.enableTierGlow, heroTier]);
  
  // Memoize tier glow class calculation
  const tierGlowClass = useMemo(() => {
    return overrideTierColors 
      ? 'hero-image--tier-3' // Use a tier class to enable styling when override colors are provided
      : (settings?.enableTierGlow 
        ? getTierGlowClass(heroTier)
        : '');
  }, [overrideTierColors, settings?.enableTierGlow, heroTier]);

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
        unitId={unitId}
        heroesData={heroesData}
      />
      {itemIconPath && (
        <img
          src={itemIconPath}
          alt="Equipped item"
          className="hero-portrait__item-icon"
        />
      )}
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

