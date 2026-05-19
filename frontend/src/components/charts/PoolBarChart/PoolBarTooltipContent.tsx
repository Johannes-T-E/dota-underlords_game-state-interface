import type { CSSProperties, ReactNode } from 'react';
import type { PoolBarStat } from '@/utils/poolBarStats';
import { PoolBarChart } from './PoolBarChart';
import './PoolBarChart.css';

export interface PoolBarTooltipMetrics {
  pixelsPerPoolUnit: number;
  labelHeightPx: number;
}

export interface PoolBarTooltipContentProps {
  title: string;
  titleIcon?: ReactNode;
  borderColor: string;
  items: PoolBarStat[];
  renderLabel: (item: PoolBarStat) => ReactNode;
  metrics?: PoolBarTooltipMetrics;
}

export const PoolBarTooltipContent = ({
  title,
  titleIcon,
  borderColor,
  items,
  renderLabel,
  metrics,
}: PoolBarTooltipContentProps) => {
  const hasMetrics =
    metrics != null && metrics.pixelsPerPoolUnit > 0;

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
        <span className="pool-bar-tooltip__title-text">{title}</span>
      </div>
      <PoolBarChart
        className="pool-bar-chart--tooltip"
        items={items}
        renderLabel={renderLabel}
        emptyMessage="No heroes in synergy"
        pixelsPerPoolUnit={hasMetrics ? metrics.pixelsPerPoolUnit : undefined}
        labelHeightPx={hasMetrics ? metrics.labelHeightPx : undefined}
      />
    </div>
  );
};
