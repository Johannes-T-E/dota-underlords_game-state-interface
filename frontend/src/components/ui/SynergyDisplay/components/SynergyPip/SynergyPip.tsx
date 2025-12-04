import React, { useMemo, useRef, useEffect, useState } from 'react';
import { STATE_COMPONENTS } from './components/PipStates';
import './SynergyPip.css';
import './components/PipStates/PipStates.css';

export interface SynergyPipProps {
  /** Number of levels (bars) to display */
  levels: number;
  /** Number of pips per level (1, 2, or 3) */
  pips_per_level: number;
  /** Number of active pips (A) */
  number_of_A?: number;
  /** Number of bench pips (B) */
  number_of_B?: number;
  /** Color for active/filled pips (hex color format) */
  fillColor?: string;
  /** Color for empty/inactive pips (hex color format) */
  backgroundColor?: string;
}

/**
 * Generate pip state strings for each level
 * E.g., for 3 levels, 2 pips/level, 3 A, 1 B: ["AA", "AB", "EE"]
 */
function generateState(
  levels: number, 
  pips_per_level: number, 
  number_of_A: number, 
  number_of_B: number
): string[] {
  const totalPips = levels * pips_per_level;
  const maxA = Math.min(number_of_A, totalPips);
  const remainingAfterA = totalPips - maxA;
  const maxB = Math.min(number_of_B, remainingAfterA);
  const number_of_E = totalPips - maxA - maxB;
  
  const flatArray = [
    ...Array(Math.max(0, maxA)).fill('A'),
    ...Array(Math.max(0, maxB)).fill('B'),
    ...Array(Math.max(0, number_of_E)).fill('E')
  ];
  
  const levelStates: string[] = [];
  for (let i = 0; i < levels; i++) {
    const levelPips = flatArray.slice(i * pips_per_level, (i + 1) * pips_per_level);
    levelPips.sort();
    levelStates.push(levelPips.join(''));
  }
  
  return levelStates;
}

const ASPECT_RATIO = 26 / 128;

/**
 * SynergyPip - Optimized component for displaying synergy pip states
 * 
 * Features:
 * - Pre-rendered atomic state components (19 total states)
 * - Pixel-perfect positioning with ResizeObserver
 * - Heavy memoization for performance
 * - CSS custom properties for colors
 * - Handles 100+ instances at 5 updates/sec
 */
export const SynergyPip: React.FC<SynergyPipProps> = ({ 
  levels, 
  pips_per_level, 
  number_of_A = 0, 
  number_of_B = 0, 
  fillColor = '#ff0000',
  backgroundColor = '#000000'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState<number | null>(null);

  // Memoize level states calculation
  const levelStates = useMemo(() => {
    return generateState(levels, pips_per_level, number_of_A, number_of_B);
  }, [levels, pips_per_level, number_of_A, number_of_B]);

  // Memoize config key
  const pips_per_bar_config_key = useMemo(() => {
    const pips_per_level_num = Number(pips_per_level);
    return `${pips_per_level_num}_pip${pips_per_level_num > 1 ? 's' : ''}_per_bar`;
  }, [pips_per_level]);

  // Calculate bar width based on container height
  useEffect(() => {
    if (!containerRef.current || levelStates.length === 0) return;

    const updateBarWidth = () => {
      const container = containerRef.current;
      if (container) {
        const containerHeight = container.offsetHeight;
        if (containerHeight > 0) {
          const calculatedBarWidth = Math.round(containerHeight * ASPECT_RATIO);
          setBarWidth(calculatedBarWidth);
        }
      }
    };

    updateBarWidth();

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateBarWidth);
    });
    
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [levelStates.length]);

  const componentMap = STATE_COMPONENTS[pips_per_bar_config_key];
  if (!componentMap) return null;

  // Memoize display style with calculated width
  const displayStyle = useMemo(() => {
    const baseStyle: React.CSSProperties & Record<string, string> = {
      '--fill-color': fillColor,
      '--background-color': backgroundColor
    };
    
    // Calculate container width based on number of levels and aspect ratio
    // Each level is 26px wide when height is 128px (26/128 aspect ratio)
    if (barWidth !== null && levelStates.length > 0) {
      baseStyle.width = `${levelStates.length * barWidth}px`;
    } else if (levelStates.length > 0) {
      // Fallback: use aspect ratio calculation (26/128 = 0.203125)
      // Assuming height will be 128px, calculate width
      const estimatedWidth = levelStates.length * (128 * ASPECT_RATIO);
      baseStyle.width = `${estimatedWidth}px`;
    }
    
    return baseStyle;
  }, [fillColor, backgroundColor, barWidth, levelStates.length]);

  // Memoize rendered levels
  const renderedLevels = useMemo(() => {
    if (barWidth === null) {
      // Fallback to percentage while measuring
      return levelStates.map((stateKey, levelIndex) => {
        const StateComponent = componentMap[stateKey];
        if (!StateComponent) return null;

        return (
          <div
            key={levelIndex}
            className="synergy-pip-level-wrapper"
            style={{ 
              left: `${levelIndex * 33.333}%`
            }}
          >
            <StateComponent />
          </div>
        );
      });
    }

    // Use pixel-perfect positioning
    return levelStates.map((stateKey, levelIndex) => {
      const StateComponent = componentMap[stateKey];
      if (!StateComponent) return null;

      return (
        <div
          key={levelIndex}
          className="synergy-pip-level-wrapper"
          style={{ 
            left: `${levelIndex * barWidth}px`,
            width: `${barWidth}px`
          }}
        >
          <StateComponent />
        </div>
      );
    });
  }, [levelStates, componentMap, barWidth]);

  return (
    <div 
      ref={containerRef}
      className="synergy-pip"
      style={displayStyle}
    >
      {renderedLevels}
    </div>
  );
};

export default SynergyPip;

