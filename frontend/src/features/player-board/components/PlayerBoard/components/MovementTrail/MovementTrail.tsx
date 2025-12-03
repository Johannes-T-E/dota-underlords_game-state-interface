import { useEffect, useState, useRef } from 'react';
import { getTierColor } from '@/utils/tierColors';
import './MovementTrail.css';

export interface MovementTrailProps {
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  duration: number;
  trailLength: number;
  cellSize: number;
  gapSize: number;
  trailColor?: string;
  trailOpacity?: number;
  trailThickness?: number;
  useTierColor?: boolean;
  unitId?: number; // Hero unit ID for tier color lookup
  onComplete?: () => void;
}

export const MovementTrail = ({
  fromPosition,
  toPosition,
  duration,
  trailLength,
  cellSize,
  gapSize,
  trailColor = '#ffffff',
  trailOpacity = 0.6,
  trailThickness = 2,
  useTierColor = false,
  unitId,
  onComplete
}: MovementTrailProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationId] = useState(() => Math.random().toString(36).substr(2, 9));
  
  // Track inner timeout for proper cleanup
  const innerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate the actual trail color based on settings
  const actualTrailColor = useTierColor && unitId ? getTierColor(unitId) : trailColor;
  
  // Convert hex color to RGBA for proper opacity support
  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  
  const trailColorWithOpacity = hexToRgba(actualTrailColor, trailOpacity);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Add a small delay before calling onComplete to ensure fade-out completes
      innerTimeoutRef.current = setTimeout(() => {
        onComplete?.();
      }, 100);
    }, duration);

    return () => {
      clearTimeout(timer);
      if (innerTimeoutRef.current) {
        clearTimeout(innerTimeoutRef.current);
      }
    };
  }, [duration, onComplete]);

  // Use the exact same coordinate calculation as the animated units
  const cellStep = cellSize + gapSize; // 84px
  const sectionGap = 12; // Gap between roster and bench sections
  const padding = 16; // player-board__grid-container padding
  
  // Calculate positions exactly like PlayerBoard (centered + padding)
  const calculatePosition = (x: number, y: number) => {
    if (y === -1) {
      // Bench position: below 4 rows of roster + section gap
      const benchTop = (4 * cellStep) + sectionGap;
      return {
        x: padding + x * cellStep + cellSize / 2, // Center horizontally + padding
        y: padding + benchTop + cellSize / 2 - 4 // Center vertically + padding - 4px adjustment
      };
    } else {
      // Roster position: y=3→0px, y=2→84px, y=1→168px, y=0→252px
      return {
        x: padding + x * cellStep + cellSize / 2, // Center horizontally + padding
        y: padding + (3 - y) * cellStep + cellSize / 2 // Center vertically + padding
      };
    }
  };

  const fromPos = calculatePosition(fromPosition.x, fromPosition.y);
  const toPos = calculatePosition(toPosition.x, toPosition.y);

  // Calculate SVG positioning (positions are already centered)
  const svgLeft = Math.min(fromPos.x, toPos.x) - cellSize/2;
  const svgTop = Math.min(fromPos.y, toPos.y) - cellSize/2;
  const svgWidth = Math.max(Math.abs(toPos.x - fromPos.x) + cellSize, cellSize);
  const svgHeight = Math.max(Math.abs(toPos.y - fromPos.y) + cellSize, cellSize);

  // Calculate SVG path - coordinates relative to SVG position
  const pathData = `M ${fromPos.x - svgLeft} ${fromPos.y - svgTop} L ${toPos.x - svgLeft} ${toPos.y - svgTop}`;

  // Calculate trail segments (positions are already centered)
  const segments = [];
  for (let i = 0; i < trailLength; i++) {
    const progress = i / (trailLength - 1);
    const x = fromPos.x + (toPos.x - fromPos.x) * progress;
    const y = fromPos.y + (toPos.y - fromPos.y) * progress;
    
    segments.push({
      x: x,
      y: y,
      delay: (i / trailLength) * duration
    });
  }

  if (!isVisible) return null;

  return (
    <div 
      className="movement-trail" 
      key={`trail-${animationId}`}
      style={{
        position: 'absolute',
        left: svgLeft,
        top: svgTop,
        width: svgWidth,
        height: svgHeight,
        zIndex: 5
      }}
    >
      {/* SVG path for the trail line */}
      <svg 
        className="movement-trail__path"
        style={{
          width: svgWidth,
          height: svgHeight,
          position: 'absolute',
          left: 0,
          top: 0
        }}
      >
        <path
          d={pathData}
          stroke={trailColorWithOpacity}
          strokeWidth={trailThickness}
          fill="none"
          strokeDasharray="5,5"
          className="movement-trail__line"
        />
      </svg>

      {/* Trail segments (fading dots) */}
      {segments.map((segment, index) => (
        <div
          key={`segment-${animationId}-${index}`}
          className="movement-trail__segment"
          style={{
            position: 'absolute',
            left: segment.x - svgLeft - 3,
            top: segment.y - svgTop - 3,
            width: '6px',
            height: '6px',
            backgroundColor: trailColorWithOpacity,
            borderRadius: '50%',
            animationDelay: `${segment.delay}ms`,
            animationDuration: `${duration}ms`
          }}
        />
      ))}
    </div>
  );
};
