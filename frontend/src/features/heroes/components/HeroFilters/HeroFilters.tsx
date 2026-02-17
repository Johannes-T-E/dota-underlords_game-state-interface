import { useMemo } from 'react';
import { getTierColor } from '@/utils/tierColors';
import { SynergyIcon } from '@/components/ui/SynergyDisplay/components';
import synergyStyles from '@/components/ui/SynergyDisplay/data/synergy-styles.json';
import synergyIconMap from '@/components/ui/SynergyDisplay/data/synergy-icon-map.json';
import keywordMappings from '@/components/ui/SynergyDisplay/data/synergy-keyword-mappings.json';
import type { SortOption, ViewMode } from '../../utils/heroFilters';
import './HeroFilters.css';
import '@/components/ui/SynergyDisplay/synergy-colors.css';

export interface HeroFiltersProps {
  searchQuery: string;
  selectedTiers: Set<number>;
  selectedSynergies: Set<number>;
  selectedRank: number; // 0 = ★, 1 = ★★, 2 = ★★★
  sortBy: SortOption;
  viewMode: ViewMode;
  tierFilterMode: 'AND' | 'OR';
  synergyFilterMode: 'AND' | 'OR';
  onSearchChange: (query: string) => void;
  onTierToggle: (tier: number) => void;
  onSynergyToggle: (keyword: number) => void;
  onRankChange: (rank: number) => void;
  onSortChange: (sort: SortOption) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onTierFilterModeChange: (mode: 'AND' | 'OR') => void;
  onSynergyFilterModeChange: (mode: 'AND' | 'OR') => void;
  onClearFilters: () => void;
}

// Inactive synergies to exclude
const INACTIVE_SYNERGY_KEYWORDS = [26, 28, 29, 31, 32, 33];

function getSynergyVisualData(synergyName: string) {
  const styleNumber = (synergyStyles as Record<string, number>)[synergyName] || 1;
  const iconFile = (synergyIconMap as Record<string, string>)[synergyName] || 'beast_psd.png';
  
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
}

export const HeroFilters = ({
  searchQuery,
  selectedTiers,
  selectedSynergies,
  selectedRank,
  sortBy,
  viewMode,
  tierFilterMode,
  synergyFilterMode,
  onSearchChange,
  onTierToggle,
  onSynergyToggle,
  onRankChange,
  onSortChange,
  onViewModeChange,
  onTierFilterModeChange,
  onSynergyFilterModeChange,
  onClearFilters,
}: HeroFiltersProps) => {

  // Get all available synergies, excluding inactive ones
  const allSynergies = useMemo(() => {
    const mappings = keywordMappings.keyword_mappings as Record<string, string>;
    return Object.entries(mappings)
      .map(([keywordStr, synergyName]) => ({
        keyword: Number(keywordStr),
        synergyName,
      }))
      .filter(({ keyword }) => !INACTIVE_SYNERGY_KEYWORDS.includes(keyword))
      .sort((a, b) => a.synergyName.localeCompare(b.synergyName));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      selectedTiers.size > 0 ||
      selectedSynergies.size > 0 ||
      selectedRank !== 0
    );
  }, [searchQuery, selectedTiers, selectedSynergies, selectedRank]);

  return (
    <div className="hero-filters">
      <div className="hero-filters__row hero-filters__row--main">
        <div className="hero-filters__search">
          <input
            type="text"
            className="hero-filters__search-input"
            placeholder="Search heroes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="hero-filters__control-group">
          <label className="hero-filters__label">Sort:</label>
          <select
            className="hero-filters__select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="tier-asc">Tier (1-5)</option>
            <option value="tier-desc">Tier (5-1)</option>
          </select>
        </div>

        <div className="hero-filters__actions">
          {hasActiveFilters && (
            <button
              type="button"
              className="hero-filters__clear-button"
              onClick={onClearFilters}
            >
              Clear All Filters
            </button>
          )}
          <div className="hero-filters__view-toggle">
            <button
              type="button"
              className={`hero-filters__view-button ${viewMode === 'grid' ? 'hero-filters__view-button--active' : ''}`}
              onClick={() => onViewModeChange('grid')}
              title="Grid View"
            >
              ▦
            </button>
            <button
              type="button"
              className={`hero-filters__view-button ${viewMode === 'table' ? 'hero-filters__view-button--active' : ''}`}
              onClick={() => onViewModeChange('table')}
              title="Table View"
            >
              ☷
            </button>
          </div>
        </div>
      </div>

      <div className="hero-filters__row hero-filters__row--filters">
        {/* Rank filter */}
        <div className="hero-filters__rank-filter">
          <div className="hero-filters__filter-header">
            <label>Rank:</label>
          </div>
          <div className="hero-filters__rank-buttons">
            {[
              { value: 0, label: '★' },
              { value: 1, label: '★★' },
              { value: 2, label: '★★★' },
            ].map(({ value, label }) => {
              const isActive = selectedRank === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`hero-filters__rank-button ${
                    isActive ? 'hero-filters__rank-button--active' : ''
                  }`}
                  onClick={() => onRankChange(value)}
                  title={`Rank ${value + 1}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier filter */}
        <div className="hero-filters__tier-filter">
          <div className="hero-filters__filter-header">
            <label>Tier:</label>
            <div className="hero-filters__filter-mode-toggle">
              <button
                type="button"
                className={`hero-filters__mode-button ${
                  tierFilterMode === 'OR' ? 'hero-filters__mode-button--active' : ''
                }`}
                onClick={() => onTierFilterModeChange('OR')}
                title="OR: Show heroes matching any selected tier"
              >
                OR
              </button>
              <button
                type="button"
                className={`hero-filters__mode-button ${
                  tierFilterMode === 'AND' ? 'hero-filters__mode-button--active' : ''
                }`}
                onClick={() => onTierFilterModeChange('AND')}
                title="AND: Show heroes matching all selected tiers"
              >
                AND
              </button>
            </div>
          </div>
          <div className="hero-filters__tier-buttons">
            {[1, 2, 3, 4, 5].map(tier => {
              const isActive = selectedTiers.has(tier);
              const tierColor = getTierColor(tier);
              return (
                <button
                  key={tier}
                  type="button"
                  className={`hero-filters__tier-button ${
                    isActive ? 'hero-filters__tier-button--active' : ''
                  }`}
                  onClick={() => onTierToggle(tier)}
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
        <div className="hero-filters__synergy-filter">
          <div className="hero-filters__filter-header">
            <label>Synergy:</label>
            <div className="hero-filters__filter-mode-toggle">
              <button
                type="button"
                className={`hero-filters__mode-button ${
                  synergyFilterMode === 'OR' ? 'hero-filters__mode-button--active' : ''
                }`}
                onClick={() => onSynergyFilterModeChange('OR')}
                title="OR: Show heroes matching any selected synergy"
              >
                OR
              </button>
              <button
                type="button"
                className={`hero-filters__mode-button ${
                  synergyFilterMode === 'AND' ? 'hero-filters__mode-button--active' : ''
                }`}
                onClick={() => onSynergyFilterModeChange('AND')}
                title="AND: Show heroes matching all selected synergies"
              >
                AND
              </button>
            </div>
          </div>
          <div className="hero-filters__synergy-buttons">
            {allSynergies.map(({ keyword, synergyName }) => {
              const isActive = selectedSynergies.has(keyword);
              const visual = getSynergyVisualData(synergyName);
              return (
                <button
                  key={keyword}
                  type="button"
                  className={`hero-filters__synergy-button ${
                    isActive ? 'hero-filters__synergy-button--active' : ''
                  }`}
                  onClick={() => onSynergyToggle(keyword)}
                  title={synergyName}
                >
                  <div className="hero-filters__synergy-icon-wrapper">
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
    </div>
  );
};

