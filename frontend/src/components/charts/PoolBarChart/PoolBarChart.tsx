import {
  useMemo,
  useState,
  useCallback,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { PoolBarStat } from '@/utils/poolBarStats';
import { HoverTooltip } from '@/components/ui/HoverTooltip/HoverTooltip';
import { PoolBarAggregateFill } from './PoolBarAggregateFill';
import { PoolBarPipFill } from './PoolBarPipFill';
import { PoolBarSegmentFill } from './PoolBarSegmentFill';
import {
  PoolBarTooltipContent,
  type PoolBarTooltipMetrics,
} from './PoolBarTooltipContent';
import { computePoolBarTooltipMetrics } from './poolBarTooltipMetrics';
import './PoolBarChart.css';

export const POOL_BAR_MAIN_LABEL_HEIGHT_PX = 60;
const MAIN_LABEL_HEIGHT_PX = POOL_BAR_MAIN_LABEL_HEIGHT_PX;
export const POOL_BAR_TOOLTIP_CHART_PADDING_Y_PX = 24;
const TOOLTIP_CHART_PADDING_Y_PX = POOL_BAR_TOOLTIP_CHART_PADDING_Y_PX;
export const POOL_BAR_TOOLTIP_BAR_ICON_GAP_PX = 6;
const TOOLTIP_BAR_ICON_GAP_PX = POOL_BAR_TOOLTIP_BAR_ICON_GAP_PX;
/** Synergy-tooltip breakdown: ~4px per pool copy at typical measured bar heights */
export const POOL_BAR_TOOLTIP_PX_PER_POOL_UNIT = 4;
export const POOL_BAR_TOOLTIP_ICON_SIZE_PX = 40;
/** Icon + gap + pool count line (matches tooltip column layout). */
export const POOL_BAR_TOOLTIP_LABEL_HEIGHT_PX =
  POOL_BAR_TOOLTIP_ICON_SIZE_PX + TOOLTIP_BAR_ICON_GAP_PX + 14;

export interface PoolBarChartProps {
  items: PoolBarStat[];
  renderLabel: (item: PoolBarStat) => ReactNode;
  emptyMessage?: string;
  className?: string;
  tooltipEnabled?: boolean;
  heroBreakdownByItemId?: Map<string | number, PoolBarStat[]>;
  renderTooltipLabel?: (item: PoolBarStat) => ReactNode;
  /** Tooltip / mini chart: fixed pip height via pixelsPerPoolUnit; column width is 40px in CSS */
  pixelsPerPoolUnit?: number;
  labelHeightPx?: number;
  /** Per-column pip colors (index 0 = top); uses PoolBarSegmentFill instead of PoolBarPipFill */
  pipSegmentsByItemId?: Map<string | number, string[]>;
  onItemClick?: (item: PoolBarStat) => void;
  /** Show remaining / total under column icons (synergy view hides this; counts go in tooltip header) */
  showLabelText?: boolean;
  /**
   * `aggregate`: proportional fill + uniform stripes (dashboard tier/synergy totals).
   * `per-copy`: one pip per pool copy (default; full-page hero pool stats).
   */
  barFillMode?: 'per-copy' | 'aggregate';
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
  pipSegmentsByItemId,
  onItemClick,
  showLabelText = true,
  barFillMode = 'per-copy',
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
    (item: PoolBarStat) => {
      const breakdown = heroBreakdownByItemId?.get(item.id);
      const metricsMaxPool =
        breakdown != null && breakdown.length > 0
          ? Math.max(...breakdown.map((hero) => hero.totalPool))
          : maxTotalPool;
      const metrics = computePoolBarTooltipMetrics(metricsMaxPool);
      setTooltipMetricsByItemId((prev) => {
        const next = new Map(prev);
        next.set(item.id, metrics);
        return next;
      });
    },
    [heroBreakdownByItemId, maxTotalPool]
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
    !showLabelText ? 'pool-bar-chart--icon-only-label' : '',
    showLabelText ? 'pool-bar-chart--with-label-text' : '',
    barFillMode === 'aggregate' ? 'pool-bar-chart--aggregate-fill' : '',
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
          const pipSegments = pipSegmentsByItemId?.get(item.id);

          const barWrapper = (
            <div
              key={item.id}
              className={`pool-bar-chart__bar-wrapper${onItemClick ? ' pool-bar-chart__bar-wrapper--clickable' : ''}`}
              onMouseEnter={
                hasTooltip ? () => handleTooltipBarMouseEnter(item) : undefined
              }
              onClick={onItemClick ? () => onItemClick(item) : undefined}
              onKeyDown={
                onItemClick
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onItemClick(item);
                      }
                    }
                  : undefined
              }
              role={onItemClick ? 'button' : undefined}
              tabIndex={onItemClick ? 0 : undefined}
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
                  {pipSegments != null && pipSegments.length > 0 ? (
                    <PoolBarSegmentFill segments={pipSegments} />
                  ) : barFillMode === 'aggregate' ? (
                    <PoolBarAggregateFill
                      totalPool={item.totalPool}
                      remainingPool={item.remainingPool}
                      fillColor={item.color}
                    />
                  ) : (
                    <PoolBarPipFill
                      totalPool={item.totalPool}
                      remainingPool={item.remainingPool}
                      fillColor={item.color}
                    />
                  )}
                </div>
              </div>
              <div className="pool-bar-chart__label">
                <div className="pool-bar-chart__label-icon">{renderLabel(item)}</div>
                {showLabelText && (
                  <div className="pool-bar-chart__label-text">
                    {item.remainingPool} / {item.totalPool}
                  </div>
                )}
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
                    remainingPool={item.remainingPool}
                    totalPool={item.totalPool}
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
