import { useMemo } from 'react';
import { SynergyIcon } from '@/components/ui';
import synergyStyles from '@/components/ui/SynergyDisplay/data/synergy-styles.json';
import synergyIconMap from '@/components/ui/SynergyDisplay/data/synergy-icon-map.json';
import keywordMappings from '@/components/ui/SynergyDisplay/data/synergy-keyword-mappings.json';
import './SynergyToolbar.css';

export interface SynergyToolbarProps {
  selectedSynergyKeyword: number | null;
  onSynergyClick: (keyword: number | null) => void;
  className?: string;
}

// Inactive synergies to exclude from toolbar
const INACTIVE_SYNERGY_KEYWORDS = [26, 28, 29, 31, 32, 33]; // MegaAssassin, MegaElusive, MegaWarlock, MegaTroll, MegaDemon, Primordial

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

export const SynergyToolbar = ({
  selectedSynergyKeyword,
  onSynergyClick,
  className = ''
}: SynergyToolbarProps) => {
  // Get all active synergies from keyword mappings, sorted by keyword number
  const allSynergies = useMemo(() => {
    const mappings = keywordMappings.keyword_mappings as Record<string, string>;
    return Object.entries(mappings)
      .map(([keywordStr, synergyName]) => ({
        keyword: Number(keywordStr),
        synergyName
      }))
      .filter(({ keyword }) => !INACTIVE_SYNERGY_KEYWORDS.includes(keyword))
      .sort((a, b) => a.keyword - b.keyword);
  }, []);

  const handleSynergyClick = (keyword: number) => {
    // Toggle: if same keyword clicked, deselect; otherwise select
    onSynergyClick(selectedSynergyKeyword === keyword ? null : keyword);
  };

  return (
    <div className={`synergy-toolbar ${className}`}>
      <div className="synergy-toolbar__label">Filter by Synergy:</div>
      <div className="synergy-toolbar__items">
        {allSynergies.map(({ keyword, synergyName }) => {
          const isSelected = selectedSynergyKeyword === keyword;
          const visual = getSynergyVisualData(synergyName);
          
          return (
            <button
              key={keyword}
              className={`synergy-toolbar__item ${isSelected ? 'synergy-toolbar__item--selected' : ''}`}
              onClick={() => handleSynergyClick(keyword)}
              title={synergyName}
              type="button"
            >
              <div className="synergy-toolbar__icon-wrapper">
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
  );
};

