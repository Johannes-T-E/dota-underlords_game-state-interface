/**
 * SynergyDisplay Utility Functions
 * 
 * Helper functions to convert PlayerState synergy data to SynergyDisplay props
 */

import type { Synergy } from '@/types';
import type { SynergyLevel } from './SynergyDisplay';
import synergiesData from './data/synergies.json';
import keywordMappings from './data/synergy-keyword-mappings.json';
import synergyStyles from './data/synergy-styles.json';
import synergyIconMap from './data/synergy-icon-map.json';

// Type for synergies.json data (set_balance structure)
type SynergyEntry = {
  type: string;
  levels: SynergyLevel[];
  color?: string;
  [key: string]: unknown;
};

type SynergiesData = {
  set_base: Record<string, SynergyEntry>;
  set_balance: Record<string, SynergyEntry>;
};

/**
 * Get synergy level thresholds by synergy name
 * Reads from set_balance in synergies.json
 */
export function getSynergyLevels(synergyName: string): SynergyLevel[] {
  const data = synergiesData as SynergiesData;
  const synergyData = data.set_balance[synergyName];
  if (!synergyData || !synergyData.levels) {
    return [];
  }
  return synergyData.levels;
}

/**
 * Get synergy level thresholds by keyword ID
 */
export function getSynergyLevelsByKeyword(keyword: number): SynergyLevel[] {
  const keywordStr = keyword.toString();
  const synergyName = (keywordMappings.keyword_mappings as Record<string, string>)[keywordStr];
  
  if (!synergyName) {
    console.warn(`No synergy found for keyword ${keyword}`);
    return [];
  }
  
  return getSynergyLevels(synergyName);
}

/**
 * Get synergy name from keyword ID
 */
export function getSynergyNameByKeyword(keyword: number): string | null {
  const keywordStr = keyword.toString();
  return (keywordMappings.keyword_mappings as Record<string, string>)[keywordStr] || null;
}

/**
 * Get keyword ID from synergy name
 */
export function getKeywordBySynergyName(synergyName: string): number | null {
  const keyword = (keywordMappings.reverse_mappings as Record<string, number>)[synergyName];
  return keyword ?? null;
}

/**
 * Props for a single synergy display
 */
export interface SynergyDisplayData {
  keyword: number;
  levels: SynergyLevel[];
  activeUnits: number;
  benchUnits: number;
  synergyName: string;
}

/**
 * Convert a Synergy from PlayerState to SynergyDisplayData
 */
export function convertSynergyToDisplayData(synergy: Synergy): SynergyDisplayData {
  const keyword = synergy.keyword;
  const synergyName = getSynergyNameByKeyword(keyword) || 'Unknown';
  const levels = getSynergyLevelsByKeyword(keyword);
  
  return {
    keyword,
    levels,
    activeUnits: synergy.unique_unit_count,
    benchUnits: synergy.bench_additional_unique_unit_count || 0,
    synergyName,
  };
}

/**
 * Convert all synergies from a PlayerState to SynergyDisplayData array
 * Optionally filter to only active synergies (those that have met first threshold)
 */
export function convertSynergiesToDisplayData(
  synergies: Synergy[],
  options?: {
    onlyActive?: boolean;
    sortByCount?: boolean;
  }
): SynergyDisplayData[] {
  let result = synergies.map(convertSynergyToDisplayData);
  
  if (options?.onlyActive) {
    result = result.filter(data => {
      if (data.levels.length === 0) return false;
      const firstThreshold = data.levels[0]?.unitcount;
      if (firstThreshold === undefined) return false;
      return data.activeUnits >= firstThreshold;
    });
  }
  
  if (options?.sortByCount) {
    result.sort((a, b) => {
      // Sort by total unit count (active + bench) descending
      const totalA = a.activeUnits + a.benchUnits;
      const totalB = b.activeUnits + b.benchUnits;
      return totalB - totalA;
    });
  }
  
  return result;
}

/**
 * Calculate the current synergy tier (0 = inactive, 1 = first threshold, etc.)
 */
export function getSynergyTier(activeUnits: number, levels: SynergyLevel[]): number {
  if (levels.length === 0) return 0;
  
  let tier = 0;
  for (const level of levels) {
    if (activeUnits >= level.unitcount) {
      tier++;
    } else {
      break;
    }
  }
  
  return tier;
}

/**
 * Check if a synergy is active (has met at least the first threshold)
 */
export function isSynergyActive(synergy: Synergy): boolean {
  const levels = getSynergyLevelsByKeyword(synergy.keyword);
  if (levels.length === 0) return false;
  return synergy.unique_unit_count >= (levels[0]?.unitcount ?? 0);
}

/**
 * Get the next threshold for a synergy (returns null if maxed out)
 */
export function getNextThreshold(activeUnits: number, levels: SynergyLevel[]): number | null {
  for (const level of levels) {
    if (activeUnits < level.unitcount) {
      return level.unitcount;
    }
  }
  return null;
}

/**
 * Get units needed to reach the next threshold
 */
export function getUnitsToNextThreshold(activeUnits: number, levels: SynergyLevel[]): number | null {
  const next = getNextThreshold(activeUnits, levels);
  if (next === null) return null;
  return next - activeUnits;
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
 * This is used by SynergyIcon component to display synergy capsules
 */
export function getSynergyVisualData(synergyName: string) {
  const styleNumber = (synergyStyles as Record<string, number>)[synergyName] || 1;
  const iconFile = (synergyIconMap as Record<string, string>)[synergyName] || 'beast_psd.png';
  
  const colorVar = getColorVar(synergyName);
  const brightColorVar = getColorVar(synergyName, true);
  const synergyColor = getComputedColor(colorVar);
  const brightColor = getComputedColor(brightColorVar) || synergyColor;
  
  return { styleNumber, iconFile, synergyColor, brightColor };
}

/** Matches SynergyDisplay.css height: 80% */
export const SYNERGY_DISPLAY_HEIGHT_RATIO = 0.8;
/** Matches SynergyDisplay.tsx layout constants */
export const SYNERGY_ICON_ASPECT_RATIO = 1;
export const SYNERGY_PIP_ASPECT_RATIO = 26 / 128;
export const SYNERGY_ICON_TO_PIPS_OVERLAP_RATIO = 0.12;
export const SYNERGY_PIP_COLUMNS_RESERVED = 3;
export const SYNERGY_CELL_GAP_PX = 4;

/**
 * Width of one synergy slot in the scoreboard row.
 * Icon-only: square at full row height. With pips: matches SynergyDisplay width math.
 */
export function getSynergySlotWidth(
  rowHeight: number,
  showPips: boolean,
  pipColumns: number = SYNERGY_PIP_COLUMNS_RESERVED
): number {
  if (!showPips) {
    return rowHeight;
  }

  const displayHeight = rowHeight * SYNERGY_DISPLAY_HEIGHT_RATIO;
  const iconWidth = displayHeight * SYNERGY_ICON_ASPECT_RATIO;
  const pipWidth = displayHeight * SYNERGY_PIP_ASPECT_RATIO * pipColumns;
  const overlapWidth = displayHeight * SYNERGY_ICON_TO_PIPS_OVERLAP_RATIO;
  return iconWidth + pipWidth - overlapWidth;
}

/** Total width for the synergies column given max active synergy count. */
export function getSynergiesColumnWidth(
  rowHeight: number,
  maxActiveSynergies: number,
  showPips: boolean
): number {
  if (maxActiveSynergies === 0) {
    return rowHeight;
  }

  const slotWidth = getSynergySlotWidth(rowHeight, showPips);
  return maxActiveSynergies * slotWidth + (maxActiveSynergies - 1) * SYNERGY_CELL_GAP_PX;
}