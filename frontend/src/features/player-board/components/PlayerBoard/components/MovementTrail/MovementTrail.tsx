import { useEffect, useState, useRef } from 'react';
import { getTierColor } from '@/utils/tierColors';
import { calculatePosition, CELL_SIZE } from '@/features/player-board/utils/positionUtils';
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
  unitId?: number;
  onComplete?: () => void;
}

export const MovementTrail = ({
  fromPosition,
  toPosition,
  duration,
  trailLength,
  trailColor = '#ffffff',
  trailOpacity = 0.6,
  trailThickness = 2,
  useTierColor = false,
  unitId,
  onComplete
}: MovementTrailProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationId] = useState(() => Math.random().toString(36).substr(2, 9));
  const innerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate the actual trail color
  const actualTrailColor = useTierColor && unitId !== undefined ? getTierColor(unitId) : trailColor;
  
  // Convert hex color to RGBA
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

  // Use shared position calculation
  const fromPos = calculatePosition(fromPosition.x, fromPosition.y);
  const toPos = calculatePosition(toPosition.x, toPosition.y);

  // Calculate SVG positioning
  const svgLeft = Math.min(fromPos.x, toPos.x) - CELL_SIZE / 2;
  const svgTop = Math.min(fromPos.y, toPos.y) - CELL_SIZE / 2;
  const svgWidth = Math.max(Math.abs(toPos.x - fromPos.x) + CELL_SIZE, CELL_SIZE);
  const svgHeight = Math.max(Math.abs(toPos.y - fromPos.y) + CELL_SIZE, CELL_SIZE);

  // Calculate SVG path
  const pathData = `M ${fromPos.x - svgLeft} ${fromPos.y - svgTop} L ${toPos.x - svgLeft} ${toPos.y - svgTop}`;

  // Calculate trail segments
  const segments = [];
  for (let i = 0; i < trailLength; i++) {
    const progress = trailLength > 1 ? i / (trailLength - 1) : 0;
    segments.push({
      x: fromPos.x + (toPos.x - fromPos.x) * progress,
      y: fromPos.y + (toPos.y - fromPos.y) * progress,
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
