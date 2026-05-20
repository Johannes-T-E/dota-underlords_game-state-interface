import type { CSSProperties, ReactNode } from 'react';
import type { PoolBarStat } from '@/utils/poolBarStats';
import { PoolBarTooltipChart } from './PoolBarTooltipChart';
import { computePoolBarTooltipMetrics } from './poolBarTooltipMetrics';
import './PoolBarChart.css';

export interface PoolBarTooltipMetrics {
  pixelsPerPoolUnit: number;
  labelHeightPx: number;
}

export interface PoolBarTooltipContentProps {
  title: string;
  titleIcon?: ReactNode;
  remainingPool?: number;
  totalPool?: number;
  borderColor: string;
  items: PoolBarStat[];
  renderLabel: (item: PoolBarStat) => ReactNode;
  metrics?: PoolBarTooltipMetrics;
}

export const PoolBarTooltipContent = ({
  title,
  titleIcon,
  remainingPool,
  totalPool,
  borderColor,
  items,
  renderLabel,
  metrics,
}: PoolBarTooltipContentProps) => {
  const maxTotalPool = Math.max(1, ...items.map((item) => item.totalPool));
  const resolvedMetrics =
    metrics != null && metrics.pixelsPerPoolUnit > 0
      ? metrics
      : computePoolBarTooltipMetrics(maxTotalPool);

  const tooltipStyle = {
    '--pool-bar-tooltip-border-color': borderColor,
    borderColor,
  } as CSSProperties;

  return (
    <div className="pool-bar-tooltip" style={tooltipStyle}>
      <div className="pool-bar-tooltip__title">
        {titleIcon != null && (
          <span className="pool-bar-tooltip__title-icon">{titleIcon}</span>
        )}
        <span className="pool-bar-tooltip__title-text">
          <span className="pool-bar-tooltip__title-name">{title}</span>
          {totalPool != null && totalPool > 0 && (
            <span className="pool-bar-tooltip__title-pool">
              {remainingPool ?? 0} / {totalPool}
            </span>
          )}
        </span>
      </div>
      <PoolBarTooltipChart
        items={items}
        renderLabel={renderLabel}
        emptyMessage="No heroes in synergy"
        metrics={resolvedMetrics}
      />
    </div>
  );
};
