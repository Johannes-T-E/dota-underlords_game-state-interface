// HealthDisplay Utility Functions
// Contains color interpolation and parsing utilities

import type { HealthColorConfig, ColorStop, InterpolationConfig } from './HealthDisplaySettings';

// Interpolation functions
export const interpolateColor = (config: HealthColorConfig, healthValue: number): string => {
  const { colorStops, interpolation, reverse } = config;
  const stops = reverse ? [...colorStops].reverse() : colorStops;
  const clampedHealth = Math.max(0, Math.min(100, healthValue));
  
  // Find the two stops to interpolate between
  let startStop: ColorStop | undefined;
  let endStop: ColorStop | undefined;
  
  for (let i = 0; i < stops.length - 1; i++) {
    if (clampedHealth >= stops[i].position && clampedHealth <= stops[i + 1].position) {
      startStop = stops[i];
      endStop = stops[i + 1];
      break;
    }
  }
  
  // If we're at the edges
  if (!startStop || !endStop) {
    return stops[clampedHealth <= 0 ? 0 : stops.length - 1].color;
  }
  
  // Calculate interpolation factor with easing
  const segmentStart = startStop.position;
  const segmentEnd = endStop.position;
  const segmentLength = segmentEnd - segmentStart;
  const localFactor = (clampedHealth - segmentStart) / segmentLength;
  
  const easedFactor = applyEasing(localFactor, interpolation);
  
  // Interpolate between the two colors
  return interpolateRgbColors(startStop.color, endStop.color, easedFactor);
};

const applyEasing = (t: number, interpolation: InterpolationConfig): number => {
  switch (interpolation.type) {
    case 'linear':
      return t;
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return t * (2 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case 'bezier':
      if (interpolation.bezierPoints) {
        const [x1, y1, x2, y2] = interpolation.bezierPoints;
        // Simplified cubic bezier calculation
        return bezier(t, 0, y1, y2, 1);
      }
      return t;
    default:
      return t;
  }
};

const bezier = (t: number, p0: number, p1: number, p2: number, p3: number): number => {
  const t2 = t * t;
  const t3 = t2 * t;
  return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t2 * p2 + t3 * p3;
};

const interpolateRgbColors = (color1: string, color2: string, factor: number): string => {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);
  
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
  
  return `rgb(${r}, ${g}, ${b})`;
};

const parseColor = (color: string): { r: number; g: number; b: number } => {
  // Handle rgb() format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }
  
  // Handle hex format
  const hexMatch = color.match(/#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16)
    };
  }
  
  // Default fallback
  return { r: 255, g: 255, b: 255 };
};
