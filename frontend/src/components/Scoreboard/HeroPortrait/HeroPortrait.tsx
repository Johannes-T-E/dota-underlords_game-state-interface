import { memo } from "react";
import {
  getHeroIconPath,
  getStarIconPath,
  getHeroGlowColor,
} from "../../../utils/heroHelpers";
import type { HeroesData } from "../../../utils/heroHelpers";
import "./HeroPortrait.css";

interface HeroPortraitProps {
  unitId: number;
  rank: number;
  heroesData: HeroesData | null;
  className?: string;
}

export const HeroPortrait = memo(
  ({ unitId, rank, heroesData, className }: HeroPortraitProps) => {
    const heroIconPath = getHeroIconPath(unitId, heroesData);
    const starLevel = Math.min(rank || 0, 3); // Cap at 3 stars, default to 0
    const glowColor = getHeroGlowColor(unitId, heroesData);

    return (
      <div className={`hero-portrait-wrapper ${className || ""}`}>
        <img
          src={heroIconPath}
          alt={`Unit ${unitId}`}
          className="hero-portrait-image glow"
          style={{
            filter: `drop-shadow(0 0 3px ${glowColor})`,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "static/icons/hero_icons_scaled_56x56/npc_dota_hero_abaddon_png.png";
          }}
        />
        <div className="hero-portrait-stars-container">
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
    );
  }
);
