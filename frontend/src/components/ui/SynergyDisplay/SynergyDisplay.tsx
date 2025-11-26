import React, { useMemo } from 'react';
import './SynergyDisplay.css';
import './synergy-colors.css';
import SynergyIcon from './SynergyIcon';
import SynergyPip, { PipState } from './SynergyPip';
import keywordMappings from './data/synergy-keyword-mappings.json';
import synergyStyles from './data/synergy-styles.json';
import synergyIconMap from './data/synergy-icon-map.json';

export interface SynergyLevel {
  unitcount: number;
  [key: string]: unknown;
}

export interface SynergyDisplayProps {
  keyword: number;            // Synergy keyword ID
  levels?: SynergyLevel[];    // Synergy level data from synergies.json
  activeUnits?: number;       // Number of active units
  benchUnits?: number;        // Number of benched units
}

/**
 * Calculate pips per bar based on first level's unit count
 */
function getPipsPerBar(levels: SynergyLevel[]): number {
  if (!levels?.length) return 0;
  const unitsPerLevel = levels[0]?.unitcount;
  if (!unitsPerLevel) return 0;
  if (unitsPerLevel === 1) return 1;
  if (unitsPerLevel === 2) return 2;
  return 3;
}

/**
 * Calculate state of each pip: 'active', 'bench', or 'empty'
 */
function calculatePipStates(levels: SynergyLevel[], activeCount: number, benchCount: number): PipState[][] {
  const pipsPerBar = getPipsPerBar(levels);
  if (pipsPerBar === 0) return [];
  
  const bars: PipState[][] = [];
  let unitIndex = 0;
  
  for (let barIdx = 0; barIdx < levels.length; barIdx++) {
    const barPips: PipState[] = [];
    for (let pipIdx = 0; pipIdx < pipsPerBar; pipIdx++) {
      let state: PipState = 'empty';
      if (unitIndex < activeCount) {
        state = 'active';
      } else if (unitIndex < activeCount + benchCount) {
        state = 'bench';
      }
      barPips.push(state);
      unitIndex++;
    }
    bars.push(barPips);
  }
  return bars;
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
function getComputedColor(varName: string, fallback: string = '#00FF00'): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

const SynergyDisplay: React.FC<SynergyDisplayProps> = ({
  keyword,
  levels = [],
  activeUnits = 0,
  benchUnits = 0
}) => {
  // Get synergy data from keyword
  const synergyData = useMemo(() => {
    const keywordStr = keyword.toString();
    const synergyName = (keywordMappings.keyword_mappings as Record<string, string>)[keywordStr];
    
    if (!synergyName) {
      console.warn(`No synergy found for keyword ${keyword}, using default`);
      return {
        synergyName: 'Assassin',
        styleNumber: 16,
        iconFile: 'assassin_psd.png',
      };
    }
    
    const styleNumber = (synergyStyles as Record<string, number>)[synergyName] || 1;
    const iconFile = (synergyIconMap as Record<string, string>)[synergyName] || 'beast_psd.png';
    
    return { synergyName, styleNumber, iconFile };
  }, [keyword]);
  
  // Get computed colors
  const colors = useMemo(() => {
    const colorVar = getColorVar(synergyData.synergyName);
    const brightColorVar = getColorVar(synergyData.synergyName, true);
    
    return {
      synergyColor: getComputedColor(colorVar),
      brightColor: getComputedColor(brightColorVar) || getComputedColor(colorVar),
    };
  }, [synergyData.synergyName]);
  
  // Calculate pip states
  const pipsPerBar = getPipsPerBar(levels);
  const pipStates = calculatePipStates(levels, activeUnits, benchUnits);
  
  return (
    <div className="synergy-display">
      {/* Synergy Icon (capsule with icon) */}
      <SynergyIcon
        styleNumber={synergyData.styleNumber}
        iconFile={synergyData.iconFile}
        synergyName={synergyData.synergyName}
        synergyColor={colors.synergyColor}
        brightColor={colors.brightColor}
      />
      
      {/* Synergy Pips (progress bars) */}
      {pipStates.map((barPips, barIdx) => (
        <SynergyPip
          key={`pip-${barIdx}`}
          segmentNumber={barIdx + 1}
          pipsPerBar={pipsPerBar}
          pipStates={barPips}
          synergyColor={colors.synergyColor}
        />
      ))}
    </div>
  );
};

export default SynergyDisplay;

