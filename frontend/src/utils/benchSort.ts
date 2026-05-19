import type { Unit } from '@/types';

export type BenchRankDirection = 'left' | 'right';

export const extractBenchUnits = (units: Unit[] | undefined): Unit[] => {
  if (!units) return [];
  return units
    .filter((unit) => unit?.position?.y === -1 && unit?.position?.x >= 0 && unit?.position?.x <= 7)
    .sort((a, b) => a.position.x - b.position.x);
};

export const buildTargetBench = (benchUnits: Unit[], rankDirection: BenchRankDirection): Unit[] => {
  const grouped = new Map<number, Unit[]>();
  for (const unit of benchUnits) {
    const existing = grouped.get(unit.unit_id) ?? [];
    existing.push(unit);
    grouped.set(unit.unit_id, existing);
  }

  const groups = Array.from(grouped.values());
  groups.forEach((group) => {
    group.sort((a, b) => {
      if (rankDirection === 'left') return b.rank - a.rank || a.entindex - b.entindex;
      return a.rank - b.rank || a.entindex - b.entindex;
    });
  });

  groups.sort((a, b) => {
    const topA = Math.max(...a.map((u) => u.rank));
    const topB = Math.max(...b.map((u) => u.rank));
    return topB - topA || b.length - a.length || (b[0]?.unit_id ?? 0) - (a[0]?.unit_id ?? 0);
  });

  return groups.flat();
};
