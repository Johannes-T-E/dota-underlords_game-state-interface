import type {
  OwnedHeroBarData,
  OpponentOwnedSegment,
} from '@/features/shop/components/OwnedHeroesChart/OwnedHeroesChart';
import type { HeroesData } from '@/utils/heroHelpers';
import { getHeroTier } from '@/utils/heroHelpers';
import type { PoolBarStat } from '@/utils/poolBarStats';
import { getTierColor } from '@/utils/tierColors';

/** Matches PoolBarPipFill empty / pool-remaining tone */
export const POOL_REMAINING_COLOR = 'rgba(128, 128, 128, 0.22)';

/** Local player copies (matches prior private pip green) */
export const PRIVATE_OWNED_COLOR = '#22c978';

/** Distinct hues per player slot — not green, not gray */
const OPPONENT_POOL_COLORS = [
  '#5b8def',
  '#e07b39',
  '#b06cff',
  '#f0c040',
  '#3ecfcf',
  '#e85d9a',
  '#8b9b3a',
  '#c97bd4',
] as const;

export function getOpponentPoolColor(playerSlot: number): string {
  const index = Math.abs(playerSlot) % OPPONENT_POOL_COLORS.length;
  return OPPONENT_POOL_COLORS[index] ?? OPPONENT_POOL_COLORS[0];
}

export interface NormalizedOwnedHeroPips {
  totalPool: number;
  remainingPool: number;
  ownedCount: number;
  opponentSegments: OpponentOwnedSegment[];
}

/**
 * Normalize pool pip counts (same logic as legacy OwnedHeroesChart).
 */
export function ownedHeroToBarStat(
  hero: OwnedHeroBarData,
  heroesData: HeroesData | null
): PoolBarStat {
  const { totalPool, remainingPool } = normalizeOwnedHeroPips(hero);
  const tier = getHeroTier(hero.unitId, heroesData);

  return {
    id: hero.unitId,
    label: hero.heroName,
    totalPool,
    remainingPool,
    percentageRemaining:
      totalPool > 0 ? (remainingPool / totalPool) * 100 : 0,
    color: getTierColor(tier),
    tier,
  };
}

export function normalizeOwnedHeroPips(hero: OwnedHeroBarData): NormalizedOwnedHeroPips {
  const totalPool = Math.max(hero.totalPool, 1);
  const remainingPool = Math.max(0, Math.min(Math.floor(hero.remainingPool), totalPool));
  const ownedCount = Math.max(
    0,
    Math.min(Math.floor(hero.ownedCount), totalPool - remainingPool)
  );
  const maxOpponentOwned = Math.max(0, totalPool - remainingPool - ownedCount);
  const rawOpponentSum = hero.opponentOwnedSegments.reduce(
    (sum, segment) => sum + segment.count,
    0
  );
  const normalizedOpponentSegments =
    rawOpponentSum <= maxOpponentOwned || rawOpponentSum === 0
      ? hero.opponentOwnedSegments.map((segment) => ({ ...segment }))
      : hero.opponentOwnedSegments.map((segment) => ({
          ...segment,
          count: Math.floor((segment.count / rawOpponentSum) * maxOpponentOwned),
        }));
  let allocatedOpponentPips = normalizedOpponentSegments.reduce(
    (sum, segment) => sum + segment.count,
    0
  );
  const opponentSegments = [...normalizedOpponentSegments];
  let i = 0;
  while (allocatedOpponentPips < maxOpponentOwned && opponentSegments.length > 0) {
    const idx = i % opponentSegments.length;
    const currentSegment = opponentSegments[idx];
    if (currentSegment) {
      currentSegment.count += 1;
    }
    allocatedOpponentPips += 1;
    i += 1;
  }

  return {
    totalPool,
    remainingPool,
    ownedCount,
    opponentSegments,
  };
}

/**
 * Canvas segment colors: index 0 = top, last = bottom (above portrait).
 * Bottom = your copies (green), then pool remaining (gray), then opponents (top).
 */
export function buildOwnedHeroSegments(hero: OwnedHeroBarData): string[] {
  const { totalPool, remainingPool, ownedCount, opponentSegments } =
    normalizeOwnedHeroPips(hero);

  const bottomToTop: string[] = [];

  for (let i = 0; i < ownedCount; i++) {
    bottomToTop.push(PRIVATE_OWNED_COLOR);
  }
  for (let i = 0; i < remainingPool; i++) {
    bottomToTop.push(POOL_REMAINING_COLOR);
  }
  const sortedOpponents = [...opponentSegments].sort(
    (a, b) => a.playerSlot - b.playerSlot
  );
  for (const segment of sortedOpponents) {
    const color = getOpponentPoolColor(segment.playerSlot);
    for (let i = 0; i < segment.count; i++) {
      bottomToTop.push(color);
    }
  }

  while (bottomToTop.length < totalPool) {
    bottomToTop.push(POOL_REMAINING_COLOR);
  }

  return bottomToTop.slice(0, totalPool).reverse();
}
