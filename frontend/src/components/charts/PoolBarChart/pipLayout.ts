/** Per-pip vertical band inside a bar (body + optional divider below). */
export interface PipBand {
  yTop: number;
  bodyH: number;
  dividerH: number;
}

/**
 * Split bar height into integer pip bodies so rounding never leaves uneven pip heights.
 * Extra pixels go to the topmost pips first (index 0).
 */
export function getPipBands(
  totalPool: number,
  height: number,
  dividerPx: number
): PipBand[] {
  if (totalPool <= 0 || height <= 0) return [];

  const dividerCount = Math.max(0, totalPool - 1);
  const totalDividerPx = dividerPx * dividerCount;
  const bodySpace = Math.max(0, height - totalDividerPx);
  const baseBody = Math.floor(bodySpace / totalPool);
  const remainder = bodySpace - baseBody * totalPool;

  const bands: PipBand[] = [];
  let y = 0;

  for (let i = 0; i < totalPool; i++) {
    const bodyH = baseBody + (i < remainder ? 1 : 0);
    const dividerH = i < totalPool - 1 ? dividerPx : 0;
    bands.push({ yTop: y, bodyH, dividerH });
    y += bodyH + dividerH;
  }

  return bands;
}
