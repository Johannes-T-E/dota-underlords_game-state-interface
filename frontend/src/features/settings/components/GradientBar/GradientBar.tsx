import { useMemo } from 'react';
import type { HealthColorConfig } from '@/components/ui/HealthDisplay/HealthDisplaySettings';
import { interpolateColor } from '@/components/ui/HealthDisplay/HealthDisplayUtils';
import './GradientBar.css';

export interface GradientBarProps {
  config: HealthColorConfig;
  showLabels?: boolean;
  height?: number;
  className?: string;
}

export const GradientBar = ({
  config,
  showLabels = true,
  height = 40,
  className = ''
}: GradientBarProps) => {
  const gradientStops = useMemo(() => {
    const sortedStops = [...config.colorStops].sort((a, b) => a.position - b.position);
    return sortedStops.map(stop => `${stop.color} ${stop.position}%`).join(', ');
  }, [config.colorStops]);

  return (
    <div className={`gradient-bar ${className}`}>
      <div 
        className="gradient-bar__preview"
        style={{
          height: `${height}px`,
          background: `linear-gradient(to right, ${gradientStops})`
        }}
      />
      {showLabels && (
        <div className="gradient-bar__labels">
          <span className="gradient-bar__label">0 HP</span>
          <span className="gradient-bar__label">100 HP</span>
        </div>
      )}
    </div>
  );
};

