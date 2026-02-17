import { HeroPortrait, SynergyIcon } from '@/components/ui';
import { getSynergyNameByKeyword } from '@/components/ui/SynergyDisplay/utils';
import { getTierColor } from '@/utils/tierColors';
import synergyStyles from '@/components/ui/SynergyDisplay/data/synergy-styles.json';
import synergyIconMap from '@/components/ui/SynergyDisplay/data/synergy-icon-map.json';
import type { HeroesData, HeroData } from '@/utils/heroHelpers';
import './HeroItem.css';

export interface HeroItemProps {
  hero: HeroData;
  heroesData: HeroesData | null;
  onHeroClick: (unitId: number) => void;
  onDragStart?: (e: React.DragEvent, unitId: number) => void;
  className?: string;
}

// Inactive synergies to exclude
const INACTIVE_SYNERGY_KEYWORDS = [26, 28, 29, 31, 32, 33];

/**
 * Get visual data for a synergy
 */
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

export const HeroItem = ({
  hero,
  heroesData,
  onHeroClick,
  onDragStart,
  className = '',
}: HeroItemProps) => {
  const tierColor = getTierColor(hero.draftTier || 1);
  
  // Extract hero name from dota_unit_name (e.g., "npc_dota_hero_alchemist" -> "alchemist")
  const heroName = hero.dota_unit_name
    .replace('npc_dota_hero_', '')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, hero.id);
    } else {
      e.dataTransfer.setData('unitId', hero.id.toString());
      e.dataTransfer.effectAllowed = 'copy';
    }
  };

  return (
    <div
      className={`hero-item ${className}`}
      onClick={() => onHeroClick(hero.id)}
      draggable
      onDragStart={handleDragStart}
      style={{
        borderColor: tierColor,
      }}
    >
      <div className="hero-item__name">
        {heroName}
      </div>
      <HeroPortrait
        unitId={hero.id}
        rank={0}
        heroesData={heroesData}
        className="hero-item__portrait"
      />
      <div className="hero-item__synergies">
        {(hero.keywords || [])
          .filter(keyword => !INACTIVE_SYNERGY_KEYWORDS.includes(keyword))
          .map(keyword => {
            const synergyName = getSynergyNameByKeyword(keyword);
            if (!synergyName) return null;
            const visual = getSynergyVisualData(synergyName);
            return (
              <div
                key={keyword}
                className="hero-item__synergy-icon"
              >
                <SynergyIcon
                  styleNumber={visual.styleNumber}
                  iconFile={visual.iconFile}
                  synergyName={synergyName}
                  synergyColor={visual.synergyColor}
                  brightColor={visual.brightColor}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

