import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroPortrait, SynergyIcon } from '@/components/ui';
import { getSynergyNameByKeyword } from '@/components/ui/SynergyDisplay/utils';
import { getTierColor } from '@/utils/tierColors';
import synergyStyles from '@/components/ui/SynergyDisplay/data/synergy-styles.json';
import synergyIconMap from '@/components/ui/SynergyDisplay/data/synergy-icon-map.json';
import type { HeroData } from '@/utils/heroHelpers';
import type { HeroesData } from '@/utils/heroHelpers';
import './HeroCard.css';
import '@/components/ui/SynergyDisplay/synergy-colors.css';

export interface HeroCardProps {
  hero: HeroData;
  heroesData: HeroesData | null;
  className?: string;
}

// Inactive synergies to exclude
const INACTIVE_SYNERGY_KEYWORDS = [26, 28, 29, 31, 32, 33];

function getSynergyVisualData(synergyName: string) {
  const styleNumber = (synergyStyles as Record<string, number>)[synergyName] || 1;
  const iconFile = (synergyIconMap as Record<string, string>)[synergyName] || 'beast_psd.png';
  
  // Get colors from CSS variables
  const getColorVar = (name: string, bright: boolean = false): string => {
    const cssVar = name.toLowerCase();
    const suffix = bright ? '-bright' : '';
    return `--synergy-${cssVar}-color${suffix}`;
  };
  
  const getComputedColor = (varName: string, fallback: string = '#00FF00'): string => {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return value || fallback;
  };
  
  const colorVar = getColorVar(synergyName);
  const brightColorVar = getColorVar(synergyName, true);
  
  return {
    styleNumber,
    iconFile,
    synergyColor: getComputedColor(colorVar),
    brightColor: getComputedColor(brightColorVar) || getComputedColor(colorVar),
  };
}

export const HeroCard = ({ hero, heroesData, className = '' }: HeroCardProps) => {
  const navigate = useNavigate();

  const tierColor = getTierColor(hero.draftTier || 1);

  // Extract hero name from dota_unit_name (e.g., "npc_dota_hero_alchemist" -> "alchemist")
  const heroName = useMemo(() => {
    if (hero.dota_unit_name) {
      return hero.dota_unit_name
        .replace('npc_dota_hero_', '')
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    // Fallback to displayName
    if (hero.displayName && hero.displayName.startsWith('#dac_hero_name_')) {
      return hero.displayName.replace('#dac_hero_name_', '').replace(/_/g, ' ');
    }
    return 'Unknown Hero';
  }, [hero.dota_unit_name, hero.displayName]);

  const synergies = useMemo(() => {
    if (!hero.keywords || hero.keywords.length === 0) {
      return [];
    }
    return (hero.keywords || [])
      .filter(keyword => !INACTIVE_SYNERGY_KEYWORDS.includes(keyword))
      .map(keyword => {
        const synergyName = getSynergyNameByKeyword(keyword);
        if (!synergyName) return null;
        const visual = getSynergyVisualData(synergyName);
        return { keyword, synergyName, ...visual };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [hero.keywords]);

  const handleClick = () => {
    navigate(`/heroes/${hero.id}`);
  };

  return (
    <div
      className={`hero-card ${className}`}
      onClick={handleClick}
      style={{
        borderColor: tierColor,
      }}
    >
      <div className="hero-card__name">
        {heroName}
      </div>
      <HeroPortrait
        unitId={hero.id}
        rank={0}
        heroesData={heroesData}
        className="hero-card__portrait"
      />
      <div className="hero-card__synergies">
        {synergies.map(({ keyword, synergyName, styleNumber, iconFile, synergyColor, brightColor }) => (
          <div
            key={keyword}
            className="hero-card__synergy-icon"
            title={synergyName}
          >
            <SynergyIcon
              styleNumber={styleNumber}
              iconFile={iconFile}
              synergyName={synergyName}
              synergyColor={synergyColor}
              brightColor={brightColor}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

