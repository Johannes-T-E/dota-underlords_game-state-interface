import { useEffect, useRef } from 'react';

const PIP_DIVIDER_PX = 1;
const DIVIDER_COLOR = 'rgba(0, 0, 0, 0.55)';
const EMPTY_COLOR = 'rgba(128, 128, 128, 0.22)';

interface PoolBarPipFillProps {
  totalPool: number;
  remainingPool: number;
  fillColor: string;
}

export const PoolBarPipFill = ({
  totalPool,
  remainingPool,
  fillColor,
}: PoolBarPipFillProps) => {
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

      const usedPool = Math.max(0, totalPool - remainingPool);
      const pipHeight = height / totalPool;

      for (let i = 0; i < totalPool; i++) {
        const yTop = i * pipHeight;
        const yBottom = (i + 1) * pipHeight;
        const hasDivider = i < totalPool - 1;
        const bodyH = yBottom - yTop - (hasDivider ? PIP_DIVIDER_PX : 0);

        ctx.fillStyle = i < usedPool ? EMPTY_COLOR : fillColor;
        ctx.fillRect(0, yTop, width, bodyH);

        if (hasDivider) {
          ctx.fillStyle = DIVIDER_COLOR;
          ctx.fillRect(0, yBottom - PIP_DIVIDER_PX, width, PIP_DIVIDER_PX);
        }
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
