import { useLayoutEffect, useState, type RefObject } from 'react';

const MIN_SCALE = 0.35;

export interface ScoreboardFitScaleResult {
  scale: number;
  naturalWidth: number;
  naturalHeight: number;
}

const DEFAULT_RESULT: ScoreboardFitScaleResult = {
  scale: 1,
  naturalWidth: 0,
  naturalHeight: 0,
};

/**
 * Computes a uniform CSS transform scale so scoreboard content fits the scroll viewport.
 * Layout metrics (scrollWidth/Height) are unaffected by transform, so do not divide by scale.
 */
export function useScoreboardFitScale(
  enabled: boolean,
  scrollRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  deps: unknown[] = []
): ScoreboardFitScaleResult {
  const [result, setResult] = useState<ScoreboardFitScaleResult>(DEFAULT_RESULT);

  useLayoutEffect(() => {
    if (!enabled) {
      setResult(DEFAULT_RESULT);
      return;
    }

    const measure = () => {
      const scrollEl = scrollRef.current;
      const contentEl = contentRef.current;
      if (!scrollEl || !contentEl) {
        return;
      }

      const naturalWidth = contentEl.scrollWidth;
      const naturalHeight = contentEl.scrollHeight;

      if (naturalWidth <= 0 || naturalHeight <= 0) {
        return;
      }

      const widthScale = scrollEl.clientWidth / naturalWidth;
      const heightScale = scrollEl.clientHeight / naturalHeight;
      const nextScale = Math.min(1, widthScale, heightScale);
      const scale = Math.max(MIN_SCALE, nextScale);

      setResult((current) => {
        if (
          Math.abs(scale - current.scale) < 0.002 &&
          Math.abs(naturalWidth - current.naturalWidth) < 1 &&
          Math.abs(naturalHeight - current.naturalHeight) < 1
        ) {
          return current;
        }
        return { scale, naturalWidth, naturalHeight };
      });
    };

    measure();

    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl) {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(scrollEl);
    if (contentEl) {
      observer.observe(contentEl);
    }

    return () => observer.disconnect();
  }, [enabled, scrollRef, contentRef, ...deps]);

  return enabled ? result : DEFAULT_RESULT;
}
