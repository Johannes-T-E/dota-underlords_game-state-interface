import { PoolBarChart, type PoolBarChartProps } from './PoolBarChart';
import type { PoolBarTooltipMetrics } from './PoolBarTooltipContent';

export interface PoolBarTooltipChartProps
  extends Omit<
    PoolBarChartProps,
    'className' | 'pixelsPerPoolUnit' | 'labelHeightPx'
  > {
  metrics: PoolBarTooltipMetrics;
  className?: string;
}

/**
 * Mini pool bar grid — same layout/CSS as the hero-pool-stats synergy tooltip breakdown.
 */
export const PoolBarTooltipChart = ({
  metrics,
  className = '',
  ...chartProps
}: PoolBarTooltipChartProps) => {
  return (
    <PoolBarChart
      className={`pool-bar-chart--tooltip ${className}`.trim()}
      pixelsPerPoolUnit={metrics.pixelsPerPoolUnit}
      labelHeightPx={metrics.labelHeightPx}
      {...chartProps}
    />
  );
};
