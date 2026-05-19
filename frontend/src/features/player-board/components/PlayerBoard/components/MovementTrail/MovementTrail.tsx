import { useEffect, useState, useRef } from 'react';
import { getTierColor } from '@/utils/tierColors';
import { resolveUnitPixelPosition, CELL_SIZE } from '@/features/player-board/utils/positionUtils';
import './MovementTrail.css';

/** Parse #RGB / #RRGGBB to rgba(); falls back to white on invalid input. */
const hexColorToRgba = (hex: string, opacity: number): string => {
  let normalized = hex.trim().replace(/^#/, '');
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((char) => char + char)
      .join('');
  }
  if (normalized.length !== 6 || Number.isNaN(Number.parseInt(normalized, 16))) {
    return `rgba(255, 255, 255, ${opacity})`;
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

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
  /** Hero tier (1–5) when useTierColor is enabled. */
  unitTier?: number;
  benchPosition?: 'top' | 'bottom';
  showBench?: boolean;
  /** When true, trail stays visible after the movement duration (settings preview). */
  persist?: boolean;
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
  unitTier,
  benchPosition = 'bottom',
  showBench = true,
  persist = false,
  onComplete
}: MovementTrailProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationId] = useState(() => Math.random().toString(36).substr(2, 9));
  const innerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseColor =
    useTierColor && unitTier !== undefined ? getTierColor(unitTier) : trailColor;
  const trailColorWithOpacity = hexColorToRgba(baseColor, trailOpacity);

  useEffect(() => {
    if (persist) {
      return;
    }

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
  }, [duration, onComplete, persist]);

  const layoutOptions = { benchPosition, showBench };
  const fromPos = resolveUnitPixelPosition(fromPosition.x, fromPosition.y, layoutOptions);
  const toPos = resolveUnitPixelPosition(toPosition.x, toPosition.y, layoutOptions);

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

  const segmentSize = Math.max(4, trailThickness + 2);
  const segmentOffset = segmentSize / 2;
  const dashLength = Math.max(4, trailThickness * 2);

  return (
    <div
      className={`movement-trail${persist ? ' movement-trail--persist' : ''}`}
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
          className="movement-trail__line"
          stroke={trailColorWithOpacity}
          strokeWidth={trailThickness}
          fill="none"
          strokeDasharray={`${dashLength},${dashLength}`}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {segments.map((segment, index) => (
        <div
          key={`segment-${animationId}-${index}`}
          className={`movement-trail__segment${persist ? ' movement-trail__segment--persist' : ''}`}
          style={{
            position: 'absolute',
            left: segment.x - svgLeft - segmentOffset,
            top: segment.y - svgTop - segmentOffset,
            width: segmentSize,
            height: segmentSize,
            background: trailColorWithOpacity,
            borderRadius: '50%',
            ...(persist
              ? { opacity: trailOpacity }
              : {
                  animationDelay: `${segment.delay}ms`,
                  animationDuration: `${duration}ms`,
                }),
          }}
        />
      ))}
    </div>
  );
};
