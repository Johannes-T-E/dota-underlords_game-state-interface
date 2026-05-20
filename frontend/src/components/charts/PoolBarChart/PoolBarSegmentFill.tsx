import { useEffect, useRef } from 'react';
import { getPipBands } from './pipLayout';

const PIP_DIVIDER_PX = 1;
const DIVIDER_COLOR = 'rgba(0, 0, 0, 0.55)';

export interface PoolBarSegmentFillProps {
  /** One CSS color per pip; index 0 = top of bar, last = bottom */
  segments: string[];
}

export const PoolBarSegmentFill = ({ segments }: PoolBarSegmentFillProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const totalPool = segments.length;
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

      const bands = getPipBands(totalPool, height, PIP_DIVIDER_PX);

      bands.forEach(({ yTop, bodyH, dividerH }, i) => {
        ctx.fillStyle = segments[i] ?? 'rgba(128, 128, 128, 0.22)';
        ctx.fillRect(0, yTop, width, bodyH);

        if (dividerH > 0) {
          ctx.fillStyle = DIVIDER_COLOR;
          ctx.fillRect(0, yTop + bodyH, width, dividerH);
        }
      });
    };

    draw();

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(draw);
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [segments.length, segments.join('|')]);

  return (
    <div ref={containerRef} className="pool-bar-chart__pip-measure">
      <canvas ref={canvasRef} className="pool-bar-chart__pip-canvas" />
    </div>
  );
};
