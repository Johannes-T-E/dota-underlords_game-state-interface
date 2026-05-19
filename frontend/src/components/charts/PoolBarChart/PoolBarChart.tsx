import {
  useMemo,
  useState,
  useCallback,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react';
import type { PoolBarStat } from '@/utils/poolBarStats';
import { HoverTooltip } from '@/components/ui/HoverTooltip/HoverTooltip';
import { PoolBarPipFill } from './PoolBarPipFill';
import {
  PoolBarTooltipContent,
  type PoolBarTooltipMetrics,
} from './PoolBarTooltipContent';
import './PoolBarChart.css';

const MAIN_LABEL_HEIGHT_PX = 60;
const TOOLTIP_CHART_PADDING_Y_PX = 24;
const TOOLTIP_BAR_ICON_GAP_PX = 6;

export interface PoolBarChartProps {
  items: PoolBarStat[];
  renderLabel: (item: PoolBarStat) => ReactNode;
  emptyMessage?: string;
  className?: string;
  tooltipEnabled?: boolean;
  heroBreakdownByItemId?: Map<string | number, PoolBarStat[]>;
  renderTooltipLabel?: (item: PoolBarStat) => ReactNode;
  /** Tooltip: pip height from hovered synergy bar; column width comes from CSS icon size */
  pixelsPerPoolUnit?: number;
  labelHeightPx?: number;
}

function measureTooltipMetrics(
  wrapperEl: HTMLElement,
  item: PoolBarStat
): PoolBarTooltipMetrics {
  const bar = wrapperEl.querySelector('.pool-bar-chart__bar');
  const barHeightPx =
    bar instanceof HTMLElement ? bar.getBoundingClientRect().height : 0;
  const pixelsPerPoolUnit =
    item.totalPool > 0 ? barHeightPx / item.totalPool : 2;

  return {
    pixelsPerPoolUnit,
    labelHeightPx: MAIN_LABEL_HEIGHT_PX,
  };
}

export const PoolBarChart = ({
  items,
  renderLabel,
  emptyMessage = 'No pool data available',
  className = '',
  tooltipEnabled = false,
  heroBreakdownByItemId,
  renderTooltipLabel,
  pixelsPerPoolUnit,
  labelHeightPx = MAIN_LABEL_HEIGHT_PX,
}: PoolBarChartProps) => {
  const maxTotalPool = useMemo(() => {
    if (items.length === 0) return 1;
    return Math.max(...items.map((item) => item.totalPool));
  }, [items]);

  const useFixedBarMetrics =
    pixelsPerPoolUnit != null && pixelsPerPoolUnit > 0;

  const [tooltipMetricsByItemId, setTooltipMetricsByItemId] = useState<
    Map<string | number, PoolBarTooltipMetrics>
  >(() => new Map());

  const resolveTooltipLabel = renderTooltipLabel ?? renderLabel;

  const handleTooltipBarMouseEnter = useCallback(
    (item: PoolBarStat, event: MouseEvent<HTMLDivElement>) => {
      const metrics = measureTooltipMetrics(event.currentTarget, item);
      setTooltipMetricsByItemId((prev) => {
        const next = new Map(prev);
        next.set(item.id, metrics);
        return next;
      });
    },
    []
  );

  const chartStyle = useMemo((): CSSProperties | undefined => {
    if (!useFixedBarMetrics) return undefined;

    const chartBodyHeightPx = maxTotalPool * pixelsPerPoolUnit!;
    const chartContentHeightPx =
      chartBodyHeightPx + labelHeightPx + TOOLTIP_BAR_ICON_GAP_PX;
    const chartContainerHeightPx =
      chartContentHeightPx + TOOLTIP_CHART_PADDING_Y_PX;

    return {
      '--pool-bar-tooltip-chart-height': `${chartContainerHeightPx}px`,
      '--pool-bar-tooltip-content-height': `${chartContentHeightPx}px`,
      '--pool-bar-label-height': `${labelHeightPx}px`,
      '--pool-bar-icon-gap': `${TOOLTIP_BAR_ICON_GAP_PX}px`,
    } as CSSProperties;
  }, [useFixedBarMetrics, maxTotalPool, pixelsPerPoolUnit, labelHeightPx]);

  const chartClassName = [
    'pool-bar-chart',
    className,
    useFixedBarMetrics ? 'pool-bar-chart--fixed-metrics' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (items.length === 0) {
    return (
      <div className={chartClassName} style={chartStyle}>
        <div className="pool-bar-chart__empty">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={chartClassName} style={chartStyle}>
      <div className="pool-bar-chart__container">
        {items.map((item) => {
          const barHeightPercent =
            maxTotalPool > 0 ? (item.totalPool / maxTotalPool) * 100 : 100;
          const barHeightPx = useFixedBarMetrics
            ? item.totalPool * pixelsPerPoolUnit!
            : undefined;
          const breakdown = heroBreakdownByItemId?.get(item.id);
          const hasTooltip =
            tooltipEnabled &&
            breakdown != null &&
            breakdown.length > 0;
          const tooltipMetrics = tooltipMetricsByItemId.get(item.id);

          const barWrapper = (
            <div
              key={item.id}
              className="pool-bar-chart__bar-wrapper"
              onMouseEnter={
                hasTooltip
                  ? (event) => handleTooltipBarMouseEnter(item, event)
                  : undefined
              }
            >
              <div className="pool-bar-chart__bar-container">
                <div
                  className="pool-bar-chart__bar"
                  style={
                    {
                      height:
                        barHeightPx != null
                          ? `${barHeightPx}px`
                          : `${barHeightPercent}%`,
                      '--pool-bar-fill-color': item.color,
                    } as CSSProperties
                  }
                >
                  <PoolBarPipFill
                    totalPool={item.totalPool}
                    remainingPool={item.remainingPool}
                    fillColor={item.color}
                  />
                </div>
              </div>
              <div className="pool-bar-chart__label">
                <div className="pool-bar-chart__label-icon">{renderLabel(item)}</div>
                <div className="pool-bar-chart__label-text">
                  {item.remainingPool} / {item.totalPool}
                </div>
              </div>
            </div>
          );

          if (!hasTooltip) {
            return barWrapper;
          }

          return (
            <HoverTooltip
              key={item.id}
              followCursor
              className="hover-tooltip--pool-bar"
              content={
                tooltipMetrics ? (
                  <PoolBarTooltipContent
                    title={item.synergyName ?? item.label}
                    titleIcon={renderLabel(item)}
                    borderColor={item.color}
                    items={breakdown}
                    renderLabel={resolveTooltipLabel}
                    metrics={tooltipMetrics}
                  />
                ) : null
              }
            >
              {barWrapper}
            </HoverTooltip>
          );
        })}
      </div>
    </div>
  );
};
