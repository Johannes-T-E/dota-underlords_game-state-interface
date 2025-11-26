import { memo, useEffect, useState, useRef } from 'react';
import './HealthDisplay.css';
import type { HealthDisplaySettings } from './HealthDisplaySettings';
import { interpolateColor } from './HealthDisplayUtils';
import { useHealthSettings } from '@/hooks/useSettings';

export interface HealthDisplayProps {
  health: number | null;
  settings?: Partial<HealthDisplaySettings>;
  className?: string;
}

export const HealthDisplay = memo(({ 
  health, 
  settings: overrideSettings = {},
  className = '' 
}: HealthDisplayProps) => {
  // Get settings from Redux store
  const { settings: reduxSettings } = useHealthSettings();
  
  // Merge Redux settings with prop overrides (props take priority)
  const fullSettings: HealthDisplaySettings = {
    ...reduxSettings,
    ...overrideSettings,
    styling: {
      ...reduxSettings.styling,
      ...overrideSettings.styling
    },
    colorConfig: overrideSettings.colorConfig ?? reduxSettings.colorConfig
  };

  const {
    showIcon,
    showValue,
    animateOnChange,
    useColorTransition,
    colorConfig,
    styling
  } = fullSettings;
  const [isAnimating, setIsAnimating] = useState(false);
  const previousHealthRef = useRef<number | null>(health);
  const isInitialMount = useRef(true);

  // Calculate health color based on value (0-100)
  const getHealthColor = (healthValue: number | null): string => {
    if (healthValue === null || !colorConfig) return 'var(--health-color)';
    
    // Use color transition if enabled, otherwise use default color
    if (!useColorTransition) return 'var(--health-color)';
    
    // Use the configurable interpolation
    return interpolateColor(colorConfig, healthValue);
  };

  const healthColor = getHealthColor(health);

  useEffect(() => {
    // Skip animation on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousHealthRef.current = health;
      return;
    }

    // Trigger animation if enabled and health changed
    if (animateOnChange && health !== previousHealthRef.current) {
      setIsAnimating(true);
      const animDuration = styling?.animationDuration || 600;
      const timer = setTimeout(() => {
        setIsAnimating(false);
        previousHealthRef.current = health;
      }, animDuration);
      
      return () => clearTimeout(timer);
    } else {
      // Update the ref even if not animating
      previousHealthRef.current = health;
    }
  }, [health, animateOnChange, styling?.animationDuration]);

  return (
    <div 
      className={`health-display ${isAnimating ? 'health-display--animating' : ''} ${className}`}
      style={{
        '--animation-duration': styling?.animationDuration ? `${styling.animationDuration}ms` : '0.6s',
        '--animation-easing': styling?.animationEasing || 'ease-in-out',
        '--pulse-scale': styling?.pulseScale || 1.2
      } as React.CSSProperties}
    >
      {showValue && (
        <div 
          className="health-display__value"
          style={{ 
            color: healthColor,
            textShadow: styling?.textShadow || '0 0 3px #000',
            fontSize: styling?.fontSize,
            fontWeight: styling?.fontWeight,
            fontFamily: styling?.fontFamily,
            fontStyle: styling?.fontStyle
          }}
        >
          {health !== null ? health : '—'}
        </div>
      )}
      {showIcon && (
        <div 
          className="health-display__icon"
          style={{ 
            color: healthColor,
            fontSize: styling?.iconFontSize,
            marginLeft: styling?.iconMargin || '8px'
          }}
        >
          ♥
        </div>
      )}
    </div>
  );
});

HealthDisplay.displayName = 'HealthDisplay';
