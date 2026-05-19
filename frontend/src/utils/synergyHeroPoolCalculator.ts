import type { HeroesData } from './heroHelpers';
import { isDraftPoolHero } from './heroHelpers';
import type { PoolCount } from './poolCalculator';
import { cardsPerTier } from './poolCalculator';

export interface HeroPoolStat {
  unitId: number;
  heroName: string;
  draftTier: number;
  totalPool: number;
  remainingPool: number;
  usedPool: number;
  percentageRemaining: number;
}

/**
 * Per-hero pool stats for heroes belonging to a single synergy keyword.
 */
export function calculateSynergyHeroPoolStats(
  synergyKeyword: number,
  heroesData: HeroesData | null,
  poolCounts: Map<number, PoolCount>
): HeroPoolStat[] {
  if (!heroesData?.heroes) {
    return [];
  }

  const result: HeroPoolStat[] = [];

  for (const [, heroData] of Object.entries(heroesData.heroes)) {
    const unitId = heroData.id;
    if (!isDraftPoolHero(unitId)) {
      continue;
    }

    const keywords = heroData.keywords || [];
    if (!keywords.includes(synergyKeyword)) {
      continue;
    }
    const tier = heroData.draftTier;
    const totalPool = cardsPerTier[String(tier) as keyof typeof cardsPerTier] || 0;
    const poolCount = poolCounts.get(unitId);
    const remainingPool = poolCount?.remaining ?? 0;
    const usedPool = totalPool - remainingPool;
    const percentageRemaining =
      totalPool > 0 ? (remainingPool / totalPool) * 100 : 0;

    result.push({
      unitId,
      heroName: heroData.displayName,
      draftTier: tier,
      totalPool,
      remainingPool,
      usedPool,
      percentageRemaining,
    });
  }

  result.sort((a, b) => {
    if (a.draftTier !== b.draftTier) {
      return a.draftTier - b.draftTier;
    }
    return a.heroName.localeCompare(b.heroName);
  });

  return result;
}
