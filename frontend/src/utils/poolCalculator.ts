import type { PlayerState } from '@/types';
import type { HeroesData } from './heroHelpers';
import { getHeroTier } from './heroHelpers';

// Shop odds per level (probability of each tier appearing)
export const shopOdds = {
  "1":  { "tier1": 0.80, "tier2": 0.20, "tier3": 0.00, "tier4": 0.00, "tier5": 0.00 },
  "2":  { "tier1": 0.70, "tier2": 0.30, "tier3": 0.00, "tier4": 0.00, "tier5": 0.00 },
  "3":  { "tier1": 0.55, "tier2": 0.35, "tier3": 0.10, "tier4": 0.00, "tier5": 0.00 },
  "4":  { "tier1": 0.45, "tier2": 0.40, "tier3": 0.15, "tier4": 0.00, "tier5": 0.00 },
  "5":  { "tier1": 0.35, "tier2": 0.40, "tier3": 0.25, "tier4": 0.00, "tier5": 0.00 },
  "6":  { "tier1": 0.25, "tier2": 0.35, "tier3": 0.35, "tier4": 0.05, "tier5": 0.00 },
  "7":  { "tier1": 0.20, "tier2": 0.30, "tier3": 0.40, "tier4": 0.10, "tier5": 0.00 },
  "8":  { "tier1": 0.18, "tier2": 0.24, "tier3": 0.35, "tier4": 0.20, "tier5": 0.03 },
  "9":  { "tier1": 0.15, "tier2": 0.21, "tier3": 0.30, "tier4": 0.28, "tier5": 0.06 },
  "10": { "tier1": 0.12, "tier2": 0.18, "tier3": 0.28, "tier4": 0.32, "tier5": 0.10 }
};

// Total cards per tier in the pool
export const cardsPerTier = {
  "1": 30,
  "2": 20,
  "3": 18,
  "4": 12,
  "5": 10
};

export interface PoolCount {
  remaining: number;
  total: number;
}

/**
 * Converts a unit rank to pool units consumed.
 * Rank 1 = 1 unit, Rank 2 = 3 units, Rank 3 = 9 units
 */
function rankToPoolUnits(rank: number): number {
  if (rank === 1) return 1;
  if (rank === 2) return 3;
  if (rank === 3) return 9;
  return 0;
}

/**
 * Calculates how many units of each hero type remain in the pool.
 * 
 * @param players - Array of all player states
 * @param heroesData - Heroes data to get tier information
 * @returns Map of unit_id -> { remaining, total }
 */
export function calculatePoolCounts(
  players: PlayerState[],
  heroesData: HeroesData | null
): Map<number, PoolCount> {
  const poolCounts = new Map<number, PoolCount>();
  
  if (!heroesData || !heroesData.heroes) {
    return poolCounts;
  }

  // First, count how many units of each type are used across all players
  const usedUnits = new Map<number, number>();
  
  for (const player of players) {
    if (!player.units || !Array.isArray(player.units)) {
      continue;
    }
    
    for (const unit of player.units) {
      const unitId = unit.unit_id;
      const rank = unit.rank || 1;
      const poolUnits = rankToPoolUnits(rank);
      
      const currentUsed = usedUnits.get(unitId) || 0;
      usedUnits.set(unitId, currentUsed + poolUnits);
    }
  }

  // Group heroes by tier to get total pool size per hero
  const heroesByTier = new Map<number, number[]>();
  
  for (const [, heroData] of Object.entries(heroesData.heroes)) {
    const tier = heroData.draftTier;
    if (!heroesByTier.has(tier)) {
      heroesByTier.set(tier, []);
    }
    heroesByTier.get(tier)!.push(heroData.id);
  }

  // Calculate pool counts for each hero
  for (const [, heroData] of Object.entries(heroesData.heroes)) {
    const unitId = heroData.id;
    const tier = heroData.draftTier;
    const totalPool = cardsPerTier[tier as keyof typeof cardsPerTier] || 0;
    const used = usedUnits.get(unitId) || 0;
    const remaining = Math.max(0, totalPool - used);
    
    poolCounts.set(unitId, {
      remaining,
      total: totalPool
    });
  }

  return poolCounts;
}

