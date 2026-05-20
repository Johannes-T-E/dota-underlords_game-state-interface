import {
  POOL_BAR_MAIN_LABEL_HEIGHT_PX,
  POOL_BAR_TOOLTIP_BAR_ICON_GAP_PX,
  POOL_BAR_TOOLTIP_CHART_PADDING_Y_PX,
} from './PoolBarChart';
import type { PoolBarTooltipMetrics } from './PoolBarTooltipContent';

/**
 * Target pixel height for the tallest column in a tooltip / owned-heroes mini chart.
 * Decoupled from host panel size (same idea as fixed 40px column width).
 * Calibrated for max draft pool (30): tallest hero column ≈ this height (10px per pip).
 */
export const POOL_BAR_TOOLTIP_REFERENCE_BODY_PX = 300;

/** @deprecated Use POOL_BAR_TOOLTIP_REFERENCE_BODY_PX */
export const POOL_BAR_TOOLTIP_CHART_BODY_TARGET_PX =
  POOL_BAR_TOOLTIP_REFERENCE_BODY_PX;

/**
 * Fixed pip metrics for tooltip breakdown and owned-heroes charts.
 * @param maxTotalPool - Max `totalPool` among columns in that mini chart (e.g. 30 for tier-5 heroes).
 */
export function computePoolBarTooltipMetrics(
  maxTotalPool: number,
  referenceBodyPx = POOL_BAR_TOOLTIP_REFERENCE_BODY_PX
): PoolBarTooltipMetrics {
  const pool = Math.max(1, maxTotalPool);
  return {
    pixelsPerPoolUnit: referenceBodyPx / pool,
    labelHeightPx: POOL_BAR_MAIN_LABEL_HEIGHT_PX,
  };
}

/** @deprecated Use computePoolBarTooltipMetrics */
export function getDefaultPoolBarTooltipMetrics(
  maxTotalPool: number
): PoolBarTooltipMetrics {
  return computePoolBarTooltipMetrics(maxTotalPool);
}

export function getPoolBarTooltipChartHeightPx(
  maxTotalPool: number,
  metrics: PoolBarTooltipMetrics
): number {
  const chartBodyHeightPx = maxTotalPool * metrics.pixelsPerPoolUnit;
  const chartContentHeightPx =
    chartBodyHeightPx +
    metrics.labelHeightPx +
    POOL_BAR_TOOLTIP_BAR_ICON_GAP_PX;
  return chartContentHeightPx + POOL_BAR_TOOLTIP_CHART_PADDING_Y_PX;
}
