import { memo } from 'react';
import { getHeroIconPath, getStarIconPath } from '../../utils/heroHelpers';
import type { HeroesData } from '../../utils/heroHelpers';

interface HeroPortraitProps {
  unitId: number;
  rank: number;
  heroesData: HeroesData | null;
  className?: string;
}

export const HeroPortrait = memo(({ unitId, rank, heroesData, className }: HeroPortraitProps) => {
  const heroIconPath = getHeroIconPath(unitId, heroesData);
  const starLevel = Math.min(rank || 0, 3); // Cap at 3 stars, default to 0

  return (
    <div className={`hero-portrait-wrapper ${className || ''}`}>
      <img
        src={heroIconPath}
        alt={`Unit ${unitId}`}
        className="hero-portrait-image"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'static/icons/hero_icons_scaled_56x56/npc_dota_hero_abaddon_png.png';
        }}
      />
      <div className="hero-portrait-stars-container">
        <div className="hero-portrait-star-list">
          {Array.from({ length: starLevel }, (_, i) => (
            <div
              key={i}
              className={`hero-portrait-star rank${starLevel}`}
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
