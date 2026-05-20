import { useEffect, useRef } from 'react';

const EMPTY_COLOR = 'rgba(128, 128, 128, 0.22)';
/** Uniform stripe spacing (not tied to copy count). */
const STRIPE_SPACING_PX = 4;
const STRIPE_COLOR = 'rgba(0, 0, 0, 0.4)';

interface PoolBarAggregateFillProps {
  totalPool: number;
  remainingPool: number;
  fillColor: string;
}

/**
 * Dashboard / compact aggregate bars: proportional used vs remaining fill
 * with even horizontal stripes. Counts in labels/tooltips stay per-copy accurate.
 */
export const PoolBarAggregateFill = ({
  totalPool,
  remainingPool,
  fillColor,
}: PoolBarAggregateFillProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || totalPool <= 0) return;

    const draw = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      if (height <= 0 || width <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const clampedRemaining = Math.min(
        Math.max(0, remainingPool),
        totalPool
      );
      const usedPool = totalPool - clampedRemaining;
      const usedHeight = Math.round((height * usedPool) / totalPool);
      const remainingHeight = height - usedHeight;

      if (usedHeight > 0) {
        ctx.fillStyle = EMPTY_COLOR;
        ctx.fillRect(0, 0, width, usedHeight);
      }

      if (remainingHeight > 0) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(0, usedHeight, width, remainingHeight);
      }

      ctx.fillStyle = STRIPE_COLOR;
      for (let y = STRIPE_SPACING_PX; y < height; y += STRIPE_SPACING_PX) {
        ctx.fillRect(0, y, width, 1);
      }
    };

    draw();

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(draw);
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [totalPool, remainingPool, fillColor]);

  return (
    <div ref={containerRef} className="pool-bar-chart__pip-measure">
      <canvas ref={canvasRef} className="pool-bar-chart__pip-canvas" />
    </div>
  );
};
