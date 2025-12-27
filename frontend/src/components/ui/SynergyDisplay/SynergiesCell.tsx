/**
 * SynergiesCell Component
 * 
 * A compact synergy display for scoreboard rows.
 * Shows multiple synergy icons in a row, with optional pips.
 */

import React, { useMemo } from 'react';
import type { Synergy } from '@/types';
import SynergyDisplay from './SynergyDisplay';
import { SynergyIcon } from './components';
import { 
  convertSynergiesToDisplayData, 
  getSynergyTier
} from './utils';
import synergyStyles from './data/synergy-styles.json';
import synergyIconMap from './data/synergy-icon-map.json';
import './SynergiesCell.css';
import './synergy-colors.css';

export interface SynergiesCellProps {
  synergies: Synergy[];
  showPips?: boolean;       // Show progress pips (default: false for compact view)
  onlyActive?: boolean;     // Filter to active synergies only (default: true)
  maxDisplay?: number;      // Maximum number of synergies to display (default: all)
  className?: string;
  selectedSynergyKeyword?: number | null; // Optional: selected synergy keyword for highlighting
  onSynergyClick?: (keyword: number | null) => void; // Optional: click handler for synergy selection
  onSynergyHover?: (keyword: number | null) => void; // Optional: hover handler for synergy highlighting
}

/**
 * Gets the CSS variable name for a synergy's color
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

const SynergiesCell: React.FC<SynergiesCellProps> = ({
  synergies,
  showPips = false,
  onlyActive = true,
  maxDisplay,
  className = '',
  selectedSynergyKeyword = null,
  onSynergyClick,
  onSynergyHover
}) => {
  // Convert and filter synergies
  const displayData = useMemo(() => {
    let data = convertSynergiesToDisplayData(synergies, {
      onlyActive,
      sortByCount: false // We'll sort by active status and tier
    });
    
    // Sort: active synergies first, then by keyword number within each group
    data.sort((a, b) => {
      const aTier = getSynergyTier(a.activeUnits, a.levels);
      const bTier = getSynergyTier(b.activeUnits, b.levels);
      const aIsActive = aTier > 0;
      const bIsActive = bTier > 0;
      
      // Active synergies first
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      
      // Within same group (active/inactive), sort by keyword number
      return a.keyword - b.keyword;
    });
    
    // Apply max display limit
    if (maxDisplay !== undefined && data.length > maxDisplay) {
      data = data.slice(0, maxDisplay);
    }
    
    return data;
  }, [synergies, onlyActive, maxDisplay]);
  
  if (displayData.length === 0) {
    return <div className={`synergies-cell synergies-cell--empty ${className}`} />;
  }
  
  const handleSynergyClick = (keyword: number) => {
    if (!onSynergyClick) return;
    // Toggle: if same keyword clicked, deselect; otherwise select
    onSynergyClick(selectedSynergyKeyword === keyword ? null : keyword);
  };

  return (
    <div className={`synergies-cell ${showPips ? 'synergies-cell--with-pips' : 'synergies-cell--compact'} ${className}`}>
      {displayData.map((synergy) => {
        const isSelected = selectedSynergyKeyword === synergy.keyword;
        const visual = getSynergyVisualData(synergy.synergyName);
        const tier = getSynergyTier(synergy.activeUnits, synergy.levels);
        
        if (showPips) {
          // Full display with pips
          return (
            <div 
              key={synergy.keyword} 
              className={`synergies-cell__item ${isSelected ? 'synergies-cell__item--selected' : ''}`}
              onClick={() => handleSynergyClick(synergy.keyword)}
              onMouseEnter={() => onSynergyHover?.(synergy.keyword)}
              onMouseLeave={() => onSynergyHover?.(null)}
              style={{ cursor: onSynergyClick ? 'pointer' : 'default' }}
              title={`${synergy.synergyName} (${synergy.activeUnits}/${synergy.levels[synergy.levels.length - 1]?.unitcount || '?'})`}
            >
              <SynergyDisplay
                keyword={synergy.keyword}
                levels={synergy.levels}
                activeUnits={synergy.activeUnits}
                benchUnits={synergy.benchUnits}
              />
            </div>
          );
        } else {
          // Compact icon-only display
          return (
            <div 
              key={synergy.keyword} 
              className={`synergies-cell__item synergies-cell__item--tier-${tier} ${isSelected ? 'synergies-cell__item--selected' : ''}`}
              onClick={() => handleSynergyClick(synergy.keyword)}
              onMouseEnter={() => onSynergyHover?.(synergy.keyword)}
              onMouseLeave={() => onSynergyHover?.(null)}
              style={{ cursor: onSynergyClick ? 'pointer' : 'default' }}
              title={`${synergy.synergyName} (${synergy.activeUnits}/${synergy.levels[synergy.levels.length - 1]?.unitcount || '?'})`}
            >
              <SynergyIcon
                styleNumber={visual.styleNumber}
                iconFile={visual.iconFile}
                synergyName={synergy.synergyName}
                synergyColor={visual.synergyColor}
                brightColor={visual.brightColor}
              />
            </div>
          );
        }
      })}
    </div>
  );
};

export default SynergiesCell;

