import { useState, useMemo } from 'react';
import { SynergyIcon } from '@/components/ui';
import { getSynergyNameByKeyword } from '@/components/ui/SynergyDisplay/utils';
import { getTierColor } from '@/utils/tierColors';
import synergyStyles from '@/components/ui/SynergyDisplay/data/synergy-styles.json';
import synergyIconMap from '@/components/ui/SynergyDisplay/data/synergy-icon-map.json';
import { HeroItem } from './HeroItem';
import type { HeroesData } from '@/utils/heroHelpers';
import './HeroSelectionPanel.css';

export interface HeroSelectionPanelProps {
  heroesData: HeroesData | null;
  onHeroSelect: (unitId: number) => void;
  className?: string;
}

export const HeroSelectionPanel = ({
  heroesData,
  onHeroSelect,
  className = '',
}: HeroSelectionPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [selectedSynergies, setSelectedSynergies] = useState<Set<number>>(new Set());
  const [tierFilterMode, setTierFilterMode] = useState<'AND' | 'OR'>('OR');
  const [synergyFilterMode, setSynergyFilterMode] = useState<'AND' | 'OR'>('OR');

  // Contraption unit IDs
  const CONTRAPTION_IDS = [117, 143, 127];
  
  // Get all heroes as an array, excluding underlords and contraptions
  const allHeroes = useMemo(() => {
    if (!heroesData || !heroesData.heroes) {
      return [];
    }
    return Object.values(heroesData.heroes).filter(hero => {
      // Exclude underlords (IDs > 1000)
      if (hero.id > 1000) {
        return false;
      }
      // Exclude contraptions (specific IDs)
      if (CONTRAPTION_IDS.includes(hero.id)) {
        return false;
      }
      return true;
    });
  }, [heroesData]);

  // Filter heroes based on search, tier, and synergy
  const filteredHeroes = useMemo(() => {
    let filtered = allHeroes;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(hero => {
        const heroName = hero.dota_unit_name.toLowerCase();
        const displayName = hero.displayName?.toLowerCase() || '';
        return heroName.includes(query) || displayName.includes(query);
      });
    }

    // Filter by tier (if any tiers are selected)
    if (selectedTiers.size > 0) {
      if (tierFilterMode === 'OR') {
        // OR: Hero must match at least one selected tier
        filtered = filtered.filter(hero => selectedTiers.has(hero.draftTier));
      } else {
        // AND: Hero must match all selected tiers (impossible for single tier, but handle gracefully)
        // Since a hero can only have one tier, AND mode with multiple tiers would return nothing
        // So we treat it as OR when multiple tiers are selected
        if (selectedTiers.size === 1) {
          filtered = filtered.filter(hero => selectedTiers.has(hero.draftTier));
        } else {
          // Multiple tiers with AND mode - no hero can have multiple tiers, so return empty
          filtered = [];
        }
      }
    }

    // Filter by synergy (if any synergies are selected)
    if (selectedSynergies.size > 0) {
      filtered = filtered.filter(hero => {
        const keywords = hero.keywords || [];
        if (synergyFilterMode === 'OR') {
          // OR: Hero must have at least one of the selected synergies
          return keywords.some(keyword => selectedSynergies.has(keyword));
        } else {
          // AND: Hero must have all selected synergies
          const selectedArray = Array.from(selectedSynergies);
          return selectedArray.every(keyword => keywords.includes(keyword));
        }
      });
    }

    // Sort by tier, then by name
    return filtered.sort((a, b) => {
      if (a.draftTier !== b.draftTier) {
        return a.draftTier - b.draftTier;
      }
      return a.dota_unit_name.localeCompare(b.dota_unit_name);
    });
  }, [allHeroes, searchQuery, selectedTiers, selectedSynergies, tierFilterMode, synergyFilterMode]);

  // Inactive synergies to exclude (Mega synergies and Primordial)
  const INACTIVE_SYNERGY_KEYWORDS = [26, 28, 29, 31, 32, 33];

  // Get unique synergies from all heroes, excluding inactive ones
  const availableSynergies = useMemo(() => {
    const synergySet = new Set<number>();
    for (const hero of allHeroes) {
      const keywords = hero.keywords || [];
      for (const keyword of keywords) {
        // Exclude inactive synergies
        if (!INACTIVE_SYNERGY_KEYWORDS.includes(keyword)) {
          synergySet.add(keyword);
        }
      }
    }
    return Array.from(synergySet).sort((a, b) => {
      const nameA = getSynergyNameByKeyword(a) || '';
      const nameB = getSynergyNameByKeyword(b) || '';
      return nameA.localeCompare(nameB);
    });
  }, [allHeroes]);

  const handleHeroClick = (unitId: number) => {
    onHeroSelect(unitId);
  };

  const handleTierToggle = (tier: number) => {
    setSelectedTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) {
        next.delete(tier);
      } else {
        next.add(tier);
      }
      return next;
    });
  };

  const handleSynergyToggle = (keyword: number) => {
    setSelectedSynergies(prev => {
      const next = new Set(prev);
      if (next.has(keyword)) {
        next.delete(keyword);
      } else {
        next.add(keyword);
      }
      return next;
    });
  };

  // Get synergy visual data
  const getSynergyVisualData = (synergyName: string) => {
    const styleNumber = (synergyStyles as Record<string, number>)[synergyName] || 1;
    const iconFile = (synergyIconMap as Record<string, string>)[synergyName] || 'beast_psd.png';
    
    // Get synergy color from CSS variable
    const getColorVar = (name: string, bright: boolean = false): string => {
      const cssVar = name.toLowerCase();
      const suffix = bright ? '-bright' : '';
      return `--synergy-${cssVar}-color${suffix}`;
    };
    
    const getComputedColor = (varName: string, fallback: string = '#888888'): string => {
      if (typeof window === 'undefined') return fallback;
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      return value || fallback;
    };
    
    const colorVar = getColorVar(synergyName);
    const brightColorVar = getColorVar(synergyName, true);
    const synergyColor = getComputedColor(colorVar);
    const brightColor = getComputedColor(brightColorVar) || synergyColor;
    
    return { styleNumber, iconFile, synergyColor, brightColor };
  };

  return (
    <div className={`hero-selection-panel ${className}`}>
      <div className="hero-selection-panel__header">
        <h3 className="hero-selection-panel__title">Heroes</h3>
      </div>

      <div className="hero-selection-panel__filters">
        {/* Search */}
        <input
          type="text"
          placeholder="Search heroes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="hero-selection-panel__search"
        />

        {/* Tier filter */}
        <div className="hero-selection-panel__tier-filter">
          <div className="hero-selection-panel__filter-header">
            <label>Tier:</label>
            <div className="hero-selection-panel__filter-mode-toggle">
              <button
                type="button"
                className={`hero-selection-panel__mode-button ${
                  tierFilterMode === 'OR' ? 'hero-selection-panel__mode-button--active' : ''
                }`}
                onClick={() => setTierFilterMode('OR')}
                title="OR: Show heroes matching any selected tier"
              >
                OR
              </button>
              <button
                type="button"
                className={`hero-selection-panel__mode-button ${
                  tierFilterMode === 'AND' ? 'hero-selection-panel__mode-button--active' : ''
                }`}
                onClick={() => setTierFilterMode('AND')}
                title="AND: Show heroes matching all selected tiers"
              >
                AND
              </button>
            </div>
          </div>
          <div className="hero-selection-panel__tier-buttons">
            {[1, 2, 3, 4, 5].map(tier => {
              const isActive = selectedTiers.has(tier);
              const tierColor = getTierColor(tier);
              return (
                <button
                  key={tier}
                  type="button"
                  className={`hero-selection-panel__tier-button ${
                    isActive ? 'hero-selection-panel__tier-button--active' : ''
                  }`}
                  onClick={() => handleTierToggle(tier)}
                  style={isActive ? {
                    color: tierColor,
                    textShadow: `0 0 2px ${tierColor}, 0 0 4px ${tierColor}`,
                  } : {}}
                  title={`Tier ${tier}`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
        </div>

        {/* Synergy filter */}
        <div className="hero-selection-panel__synergy-filter">
          <div className="hero-selection-panel__filter-header">
            <label>Synergy:</label>
            <div className="hero-selection-panel__filter-mode-toggle">
              <button
                type="button"
                className={`hero-selection-panel__mode-button ${
                  synergyFilterMode === 'OR' ? 'hero-selection-panel__mode-button--active' : ''
                }`}
                onClick={() => setSynergyFilterMode('OR')}
                title="OR: Show heroes with any selected synergy"
              >
                OR
              </button>
              <button
                type="button"
                className={`hero-selection-panel__mode-button ${
                  synergyFilterMode === 'AND' ? 'hero-selection-panel__mode-button--active' : ''
                }`}
                onClick={() => setSynergyFilterMode('AND')}
                title="AND: Show heroes with all selected synergies"
              >
                AND
              </button>
            </div>
          </div>
          <div className="hero-selection-panel__synergy-buttons">
            {availableSynergies.map(keyword => {
              const synergyName = getSynergyNameByKeyword(keyword);
              if (!synergyName) return null;
              
              const isActive = selectedSynergies.has(keyword);
              const visual = getSynergyVisualData(synergyName);
              
              return (
                <button
                  key={keyword}
                  type="button"
                  className={`hero-selection-panel__synergy-button ${
                    isActive ? 'hero-selection-panel__synergy-button--active' : ''
                  }`}
                  onClick={() => handleSynergyToggle(keyword)}
                  style={isActive ? {
                    borderColor: visual.synergyColor,
                    boxShadow: `0 0 8px ${visual.synergyColor}, 0 0 12px ${visual.synergyColor}`,
                  } : {}}
                  title={synergyName}
                >
                  <div className="hero-selection-panel__synergy-icon-wrapper">
                    <SynergyIcon
                      styleNumber={visual.styleNumber}
                      iconFile={visual.iconFile}
                      synergyName={synergyName}
                      synergyColor={visual.synergyColor}
                      brightColor={visual.brightColor}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hero grid */}
      <div className="hero-selection-panel__grid">
        {filteredHeroes.length === 0 ? (
          <div className="hero-selection-panel__empty">
            No heroes found
          </div>
        ) : (
          filteredHeroes.map((hero) => (
            <HeroItem
              key={hero.id}
              hero={hero}
              heroesData={heroesData}
              onHeroClick={handleHeroClick}
              onDragStart={(e, unitId) => {
                e.dataTransfer.setData('unitId', unitId.toString());
                e.dataTransfer.effectAllowed = 'copy';
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

