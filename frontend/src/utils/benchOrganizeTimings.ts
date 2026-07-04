/** Persisted bench automation delays (seconds). */
export interface BenchOrganizeTimings {
  dragScale: number;
  settleAfterFocusSec: number;
  postDragDelaySec: number;
  betweenMovesSec: number;
  prePickupDelaySec: number;
  afterMousedownDelaySec: number;
  beforeMouseupDelaySec: number;
  dragStepSleepSec: number;
}

export const DEFAULT_BENCH_ORGANIZE_TIMINGS: BenchOrganizeTimings = {
  dragScale: 1,
  settleAfterFocusSec: 0.14,
  postDragDelaySec: 0.04,
  betweenMovesSec: 0.18,
  prePickupDelaySec: 0.005,
  afterMousedownDelaySec: 0.01,
  beforeMouseupDelaySec: 0.01,
  dragStepSleepSec: 0.015,
};

const clamp = (value: unknown, min: number, max: number, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
};

const legacyBetweenMovesSec = (raw: Record<string, unknown>): number | undefined => {
  const candidates = [
    raw.betweenMovesSec,
    raw.minSettleBetweenMovesSec,
    raw.interDragFallbackSec,
    raw.gsiConfirmTimeoutSec,
  ];
  const numeric = candidates.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (numeric.length === 0) {
    return undefined;
  }
  return Math.max(...numeric);
};

export const clampBenchOrganizeTimings = (
  raw: unknown,
  legacyDragScale?: number
): BenchOrganizeTimings => {
  const d = DEFAULT_BENCH_ORGANIZE_TIMINGS;
  const legacyScale =
    typeof legacyDragScale === 'number' && Number.isFinite(legacyDragScale) ? legacyDragScale : d.dragScale;
  if (!raw || typeof raw !== 'object') {
    return { ...d, dragScale: clamp(legacyScale, 0.25, 4, d.dragScale) };
  }
  const t = raw as Record<string, unknown>;
  const betweenFallback = legacyBetweenMovesSec(t) ?? d.betweenMovesSec;
  return {
    dragScale: clamp(t.dragScale ?? legacyScale, 0.25, 4, d.dragScale),
    settleAfterFocusSec: clamp(t.settleAfterFocusSec, 0.05, 0.5, d.settleAfterFocusSec),
    postDragDelaySec: clamp(t.postDragDelaySec, 0.01, 0.15, d.postDragDelaySec),
    betweenMovesSec: clamp(t.betweenMovesSec ?? betweenFallback, 0.05, 1, d.betweenMovesSec),
    prePickupDelaySec: clamp(t.prePickupDelaySec, 0.001, 0.03, d.prePickupDelaySec),
    afterMousedownDelaySec: clamp(t.afterMousedownDelaySec, 0.005, 0.05, d.afterMousedownDelaySec),
    beforeMouseupDelaySec: clamp(t.beforeMouseupDelaySec, 0.005, 0.05, d.beforeMouseupDelaySec),
    dragStepSleepSec: clamp(t.dragStepSleepSec, 0.005, 0.05, d.dragStepSleepSec),
  };
};
