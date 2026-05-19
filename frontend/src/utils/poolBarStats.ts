import type { SynergyPoolStat } from './synergyPoolCalculator';
import type { HeroPoolStat } from './synergyHeroPoolCalculator';
import type { TierPoolStat } from './tierPoolCalculator';
import { getTierColor } from './tierColors';
import synergyStyles from '@/components/ui/SynergyDisplay/data/synergy-styles.json';
import synergyIconMap from '@/components/ui/SynergyDisplay/data/synergy-icon-map.json';

export interface PoolBarStat {
  id: string | number;
  label: string;
  totalPool: number;
  remainingPool: number;
  percentageRemaining: number;
  color: string;
  /** Synergy mode: keyword for icon lookup */
  synergyKeyword?: number;
  synergyName?: string;
  /** Tier mode: 1–5 */
  tier?: number;
}

function getSynergyColor(synergyName: string): string {
  if (typeof window === 'undefined') {
    return '#888888';
  }
  const cssVar = `--synergy-${synergyName.toLowerCase()}-color`;
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return value || '#888888';
}

export function synergyStatToBarStat(stat: SynergyPoolStat): PoolBarStat {
  return {
    id: stat.keyword,
    label: stat.synergyName,
    totalPool: stat.totalPool,
    remainingPool: stat.remainingPool,
    percentageRemaining: stat.percentageRemaining,
    color: getSynergyColor(stat.synergyName),
    synergyKeyword: stat.keyword,
    synergyName: stat.synergyName,
  };
}

export function heroPoolStatToBarStat(stat: HeroPoolStat): PoolBarStat {
  return {
    id: stat.unitId,
    label: stat.heroName,
    totalPool: stat.totalPool,
    remainingPool: stat.remainingPool,
    percentageRemaining: stat.percentageRemaining,
    color: getTierColor(stat.draftTier),
  };
}

export function tierStatToBarStat(stat: TierPoolStat): PoolBarStat {
  return {
    id: stat.tier,
    label: `Tier ${stat.tier}`,
    totalPool: stat.totalPool,
    remainingPool: stat.remainingPool,
    percentageRemaining: stat.percentageRemaining,
    color: getTierColor(stat.tier),
    tier: stat.tier,
  };
}

export function getSynergyVisualData(synergyName: string) {
  const styleNumber = (synergyStyles as Record<string, number>)[synergyName] || 1;
  const iconFile = (synergyIconMap as Record<string, string>)[synergyName] || 'beast_psd.png';
  const synergyColor = getSynergyColor(synergyName);

  const brightVar = `--synergy-${synergyName.toLowerCase()}-color-bright`;
  let brightColor = synergyColor;
  if (typeof window !== 'undefined') {
    const bright = getComputedStyle(document.documentElement).getPropertyValue(brightVar).trim();
    if (bright) {
      brightColor = bright;
    }
  }

  return { styleNumber, iconFile, synergyColor, brightColor };
}

const TIER_COST_LABELS: Record<number, string> = {
  1: '$',
  2: '$$',
  3: '$$$',
  4: '$$$$',
  5: '$$$$$',
};

export function getTierCostLabel(tier: number): string {
  return TIER_COST_LABELS[tier] ?? `T${tier}`;
}
