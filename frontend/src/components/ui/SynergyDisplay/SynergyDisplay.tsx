import React, { useMemo, memo, useRef, useEffect, useState } from 'react';
import './SynergyDisplay.css';
import './synergy-colors.css';
import { SynergyIcon, SynergyPip } from './components';
import keywordMappings from './data/synergy-keyword-mappings.json';
import synergyStyles from './data/synergy-styles.json';
import synergyIconMap from './data/synergy-icon-map.json';

export interface SynergyLevel {
  unitcount: number;
  [key: string]: unknown;
}

export interface SynergyDisplayProps {
  /** Synergy keyword ID */
  keyword: number;
  /** Synergy level data from synergies.json */
  levels?: SynergyLevel[];
  /** Number of active units on the board */
  activeUnits?: number;
  /** Number of benched units */
  benchUnits?: number;
  /** Whether to show pip display (default: true) */
  showPips?: boolean;
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

/**
 * Aspect ratio constants
 * Icon: 1:1 (square, 128x128 at base size)
 * Pip per level: 26:128 (26px wide, 128px tall at base size)
 */
const ICON_ASPECT_RATIO = 1; // Square
const PIP_ASPECT_RATIO = 26 / 128; // 0.203125

/**
 * SynergyDisplay - Displays a synergy icon with optional pip progress bars
 * 
 * Features:
 * - Modular architecture with SynergyIcon and PipDisplay subcomponents
 * - Supports icon-only mode via showPips={false}
 * - Memoized for performance
 * - Dynamic color theming via CSS variables
 * - Dynamic width calculation based on row height (similar to SynergyPip pattern)
 */
const SynergyDisplay: React.FC<SynergyDisplayProps> = memo(({
  keyword,
  levels = [],
  activeUnits = 0,
  benchUnits = 0,
  showPips = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);

  // Get synergy data from keyword - memoized
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
  
  // Get computed colors - memoized
  const colors = useMemo(() => {
    const colorVar = getColorVar(synergyData.synergyName);
    const brightColorVar = getColorVar(synergyData.synergyName, true);
    
    return {
      synergyColor: getComputedColor(colorVar),
      brightColor: getComputedColor(brightColorVar) || getComputedColor(colorVar),
    };
  }, [synergyData.synergyName]);
  
  // Calculate pips per bar - memoized
  const pipsPerBar = useMemo(() => getPipsPerBar(levels), [levels]);
  
  // Determine if we should show pips
  const shouldShowPips = showPips && pipsPerBar > 0 && levels.length > 0;

  // Calculate container width based on height and aspect ratios (similar to SynergyPip pattern)
  useEffect(() => {
    if (!containerRef.current) return;

    const updateContainerWidth = () => {
      const container = containerRef.current;
      if (container) {
        const height = container.offsetHeight;
        if (height > 0) {
          setContainerHeight(height);
        }
      }
    };

    updateContainerWidth();

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateContainerWidth);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [shouldShowPips, levels.length]);

  // Calculate width from height and aspect ratios
  const containerStyle = useMemo(() => {
    if (containerHeight === null) {
      return {}; // Let CSS handle initial sizing
    }

    if (!shouldShowPips) {
      // Icon-only: square aspect ratio
      return {
        width: `${containerHeight * ICON_ASPECT_RATIO}px`
      } as React.CSSProperties;
    }

    // With pips: icon width + pip width (always 3 levels for alignment)
    const iconWidth = containerHeight * ICON_ASPECT_RATIO;
    const pipWidth = containerHeight * PIP_ASPECT_RATIO * 3; // Always 3 levels
    const totalWidth = iconWidth + pipWidth;

    return {
      width: `${totalWidth}px`
    } as React.CSSProperties;
  }, [containerHeight, shouldShowPips]);

  // Calculate pips container width (always 3 levels)
  const pipsContainerStyle = useMemo(() => {
    if (!shouldShowPips || containerHeight === null) {
      return {};
    }
    const pipWidth = containerHeight * PIP_ASPECT_RATIO * 3; // Always 3 levels
    return {
      width: `${pipWidth}px`
    } as React.CSSProperties;
  }, [containerHeight, shouldShowPips]);

  return (
    <div 
      ref={containerRef}
      className={`synergy-display ${!shouldShowPips ? 'synergy-display--icon-only' : ''}`}
      style={containerStyle}
    >
      {/* Synergy Icon (capsule with icon) */}
      <SynergyIcon
        styleNumber={synergyData.styleNumber}
        iconFile={synergyData.iconFile}
        synergyName={synergyData.synergyName}
        synergyColor={colors.synergyColor}
        brightColor={colors.brightColor}
      />
      
      {/* Synergy Pips - using optimized SynergyPip component */}
      {shouldShowPips && (
        <div className="synergy-display__pips" style={pipsContainerStyle}>
          <SynergyPip
            levels={levels.length}
            pips_per_level={pipsPerBar}
            number_of_A={activeUnits}
            number_of_B={benchUnits}
            fillColor={colors.synergyColor}
            backgroundColor="#1a1a1a"
          />
        </div>
      )}
    </div>
  );
});

SynergyDisplay.displayName = 'SynergyDisplay';

export default SynergyDisplay;
