import type { HeroesData } from './heroHelpers';
import { isDraftPoolHero } from './heroHelpers';
import type { PoolCount } from './poolCalculator';

export interface TierPoolStat {
  tier: number;
  totalPool: number;
  remainingPool: number;
  usedPool: number;
  percentageRemaining: number;
}

const TIERS = [1, 2, 3, 4, 5] as const;

/**
 * Calculate hero pool statistics aggregated by draft tier (1–5).
 */
export function calculateTierPoolStats(
  heroesData: HeroesData | null,
  poolCounts: Map<number, PoolCount>
): TierPoolStat[] {
  const tierStats = new Map<number, { totalPool: number; remainingPool: number }>();

  for (const tier of TIERS) {
    tierStats.set(tier, { totalPool: 0, remainingPool: 0 });
  }

  if (!heroesData?.heroes) {
    return TIERS.map((tier) => ({
      tier,
      totalPool: 0,
      remainingPool: 0,
      usedPool: 0,
      percentageRemaining: 0,
    }));
  }

  for (const [, heroData] of Object.entries(heroesData.heroes)) {
    if (!isDraftPoolHero(heroData.id)) {
      continue;
    }
    const tier = heroData.draftTier;
    if (tier < 1 || tier > 5) {
      continue;
    }

    const poolCount = poolCounts.get(heroData.id);
    if (!poolCount) {
      continue;
    }

    const stat = tierStats.get(tier)!;
    stat.totalPool += poolCount.total;
    stat.remainingPool += poolCount.remaining;
  }

  return TIERS.map((tier) => {
    const stat = tierStats.get(tier)!;
    const usedPool = stat.totalPool - stat.remainingPool;
    const percentageRemaining =
      stat.totalPool > 0 ? (stat.remainingPool / stat.totalPool) * 100 : 0;

    return {
      tier,
      totalPool: stat.totalPool,
      remainingPool: stat.remainingPool,
      usedPool,
      percentageRemaining,
    };
  });
}
