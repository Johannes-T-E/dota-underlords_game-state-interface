import { useMemo } from 'react';
import type { SynergyPoolStat } from '@/utils/synergyPoolCalculator';
import { SynergyIcon } from '@/components/ui/SynergyDisplay';
import synergyStyles from '@/components/ui/SynergyDisplay/data/synergy-styles.json';
import synergyIconMap from '@/components/ui/SynergyDisplay/data/synergy-icon-map.json';
import './SynergyPoolBarChart.css';

export interface SynergyPoolBarChartProps {
  synergyPoolStats: SynergyPoolStat[];
  className?: string;
}

/**
 * Get CSS variable name for synergy color
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
 */
function getSynergyVisualData(synergyName: string) {
  const styleNumber = (synergyStyles as Record<string, number>)[synergyName] || 1;
  const iconFile = (synergyIconMap as Record<string, string>)[synergyName] || 'beast_psd.png';
  
  const colorVar = getColorVar(synergyName);
  const brightColorVar = getColorVar(synergyName, true);
  const synergyColor = getComputedColor(colorVar);
  const brightColor = getComputedColor(brightColorVar) || synergyColor;
  
  return { styleNumber, iconFile, synergyColor, brightColor };
}


export const SynergyPoolBarChart = ({
  synergyPoolStats,
  className = ''
}: SynergyPoolBarChartProps) => {
  // Find max totalPool for scaling
  const maxTotalPool = useMemo(() => {
    if (synergyPoolStats.length === 0) return 1;
    return Math.max(...synergyPoolStats.map(stat => stat.totalPool));
  }, [synergyPoolStats]);

  if (synergyPoolStats.length === 0) {
    return (
      <div className={`synergy-pool-bar-chart ${className}`}>
        <div className="synergy-pool-bar-chart__empty">
          No synergy pool data available
        </div>
      </div>
    );
  }

  return (
    <div className={`synergy-pool-bar-chart ${className}`}>
      <div className="synergy-pool-bar-chart__container">
        {synergyPoolStats.map((stat) => {
          const visual = getSynergyVisualData(stat.synergyName);
          // Calculate bar height as percentage of max total pool (for proportional sizing)
          // Use a scale factor to ensure bars use full available height
          const barHeightPercent = maxTotalPool > 0 
            ? (stat.totalPool / maxTotalPool) * 100 
            : 100;
          const fillHeightPercent = stat.percentageRemaining;
          const emptyHeightPercent = 100 - fillHeightPercent;

          return (
            <div key={stat.keyword} className="synergy-pool-bar-chart__bar-wrapper">
              <div className="synergy-pool-bar-chart__bar-container">
                <div
                  className="synergy-pool-bar-chart__bar"
                  style={{
                    height: `${barHeightPercent}%`,
                    borderColor: visual.synergyColor,
                  }}
                >
                  {/* Empty portion (used pool) - at the top */}
                  {emptyHeightPercent > 0 && (
                    <div
                      className="synergy-pool-bar-chart__bar-empty"
                      style={{
                        height: `${emptyHeightPercent}%`,
                        backgroundColor: 'rgba(128, 128, 128, 0.2)',
                      }}
                    />
                  )}
                  {/* Filled portion (remaining pool) - at the bottom */}
                  {fillHeightPercent > 0 && (
                    <div
                      className="synergy-pool-bar-chart__bar-fill"
                      style={{
                        height: `${fillHeightPercent}%`,
                        backgroundColor: visual.synergyColor,
                      }}
                    />
                  )}
                  {/* Text overlay */}
                  <div className="synergy-pool-bar-chart__bar-text">
                    {stat.remainingPool} / {stat.totalPool}
                  </div>
                </div>
              </div>
              <div className="synergy-pool-bar-chart__label">
                <div className="synergy-pool-bar-chart__icon-wrapper">
                  <SynergyIcon
                    styleNumber={visual.styleNumber}
                    iconFile={visual.iconFile}
                    synergyName={stat.synergyName}
                    synergyColor={visual.synergyColor}
                    brightColor={visual.brightColor}
                  />
                </div>
                <div className="synergy-pool-bar-chart__label-text">
                  {stat.synergyName}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

