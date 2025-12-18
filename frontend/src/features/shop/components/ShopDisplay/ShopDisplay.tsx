import { useMemo } from 'react';
import { HeroPortrait, SynergyIcon } from '@/components/ui';
import { EmptyState } from '@/components/shared';
import { getSynergyNameByKeyword } from '@/components/ui/SynergyDisplay/utils';
import synergyStyles from '@/components/ui/SynergyDisplay/data/synergy-styles.json';
import synergyIconMap from '@/components/ui/SynergyDisplay/data/synergy-icon-map.json';
import keywordMappings from '@/components/ui/SynergyDisplay/data/synergy-keyword-mappings.json';
import type { PrivatePlayerState, PlayerState } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import { calculatePoolCounts } from '@/utils/poolCalculator';
import './ShopDisplay.css';

export interface ShopDisplayProps {
  privatePlayer: PrivatePlayerState | null;
  players: PlayerState[];
  heroesData: HeroesData | null;
  selectedUnitIds?: Set<number>;
  onUnitClick?: (unitId: number) => void;
  className?: string;
}

/**
 * Get CSS variable name for synergy color
 */
function getColorVar(synergyName: string, bright: boolean = false): string {
  const cssVar = synergyName.toLowerCase();
  const suffix = bright ? '-bright' : '';
  return `--synergy-${cssVar}-color${suffix}`;
}

/**
 * Get computed color value from CSS variable
 */
function getComputedColor(varName: string, fallback: string = '#888888'): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

/**
 * Get synergy visual data (style number, icon file, colors)
 */
function getSynergyVisualData(synergyName: string) {
  const styleNumber = (synergyStyles as Record<string, number>)[synergyName] || 1;
  const iconFile = (synergyIconMap as Record<string, string>)[synergyName] || 'beast_psd.png';
  
  const colorVar = getColorVar(synergyName);
  const brightColorVar = getColorVar(synergyName, true);
  const synergyColor = getComputedColor(colorVar);
  const brightColor = getComputedColor(brightColorVar) || synergyColor;
  
  return { styleNumber, iconFile, synergyColor, brightColor };
}

/**
 * Get hero keywords as numbers from heroesData
 */
function getHeroKeywords(unitId: number, heroesData: HeroesData | null): number[] {
  if (!heroesData || !heroesData.heroes) {
    return [];
  }
  
  // Find hero by ID
  for (const [, heroData] of Object.entries(heroesData.heroes)) {
    if (heroData.id === unitId) {
      // Parse keywords string (space-separated keyword names like "fallen knight")
      if (!heroData.keywords) return [];
      
      const reverseMappings = keywordMappings.reverse_mappings as Record<string, number>;
      return heroData.keywords
        .split(' ')
        .map(k => {
          const trimmed = k.trim();
          if (!trimmed) return null;
          // Capitalize first letter to match mapping format (e.g., "fallen" -> "Fallen", "knight" -> "Knight")
          const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
          return reverseMappings[capitalized];
        })
        .filter((k): k is number => k !== null && k !== undefined && !isNaN(k));
    }
  }
  
  return [];
}

export const ShopDisplay = ({
  privatePlayer,
  players,
  heroesData,
  selectedUnitIds = new Set<number>(),
  onUnitClick,
  className = ''
}: ShopDisplayProps) => {
  // Calculate pool counts for all heroes
  const poolCounts = useMemo(() => {
    return calculatePoolCounts(players, heroesData);
  }, [players, heroesData]);

  // Get shop units, ensuring we always have 5 slots
  const shopUnits = useMemo(() => {
    if (!privatePlayer || !privatePlayer.shop_units) {
      return Array(5).fill(null).map(() => ({ unit_id: -1 }));
    }
    
    const units = [...privatePlayer.shop_units];
    // Ensure we have exactly 5 slots
    while (units.length < 5) {
      units.push({ unit_id: -1 });
    }
    return units.slice(0, 5);
  }, [privatePlayer]);

  // Show empty state if no private player data
  if (!privatePlayer) {
    return (
      <div className={`shop-display ${className}`}>
        <EmptyState
          title="No Shop Data"
          message="Waiting for private player state..."
          showSpinner={false}
        />
      </div>
    );
  }

  return (
    <div className={`shop-display ${className}`}>
      <div className="shop-display__grid">
        {shopUnits.map((shopUnit, index) => {
          const unitId = shopUnit.unit_id;
          const isEmpty = unitId === -1;
          const isSelected = !isEmpty && selectedUnitIds.has(unitId);
          const isDimmed = selectedUnitIds.size > 0 && !isSelected && !isEmpty;
          
          const poolCount = !isEmpty ? poolCounts.get(unitId) : null;
          const poolText = poolCount 
            ? `${poolCount.remaining} / ${poolCount.total}`
            : '';

          return (
            <div
              key={index}
              className={`shop-display__slot ${
                isDimmed ? 'shop-display__slot--dimmed' : ''
              } ${isSelected ? 'shop-display__slot--selected' : ''} ${
                isEmpty ? 'shop-display__slot--empty' : ''
              }`}
              onClick={() => !isEmpty && onUnitClick?.(unitId)}
              style={!isEmpty ? { cursor: 'pointer' } : undefined}
            >
              {isEmpty ? (
                <div className="shop-display__empty-slot">
                  <div className="shop-display__empty-indicator" />
                </div>
              ) : (
                <>
                  {poolText && (
                    <div className="shop-display__pool-count">
                      {poolText}
                    </div>
                  )}
                  <HeroPortrait
                    unitId={unitId}
                    rank={0}
                    heroesData={heroesData}
                    className="shop-display__hero"
                  />
                  {(() => {
                const keywords = getHeroKeywords(unitId, heroesData);
                if (keywords.length === 0) return null;
                
                return (
                  <div className="shop-display__synergies">
                    {keywords.map((keyword) => {
                      const synergyName = getSynergyNameByKeyword(keyword);
                      if (!synergyName) return null;
                      
                      const visual = getSynergyVisualData(synergyName);
                      
                      return (
                        <div key={keyword} className="shop-display__synergy-icon">
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
                  );
                  })()}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

