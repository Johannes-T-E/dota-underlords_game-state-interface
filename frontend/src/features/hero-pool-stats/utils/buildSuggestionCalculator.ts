import type { Build, BuildUnit, PlayerState, PrivatePlayerState } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import type { PoolCount } from '@/utils/poolCalculator';

export interface HeroScore {
  unitId: number;
  availability: number; // 0-1, represents feasibility to reach target rank
  competition: number; // number of other players using it
  canRank3: boolean; // true if tier 1-3 and can reach rank 3, or tier 4-5 and can reach rank 2
  score: number; // final score: feasibility × competitionPenalty
}

export interface BuildSuggestion {
  build: Build;
  score: number;
  heroScores: Map<number, HeroScore>;
  canAchieveRank3: boolean;
  competingPlayers: Map<number, number>; // unit_id -> player count
}

/**
 * Count how many unique players (excluding current player) are using each hero
 */
function countCompetingPlayers(
  build: Build,
  players: PlayerState[],
  privatePlayer: PrivatePlayerState | null,
  heroesData: HeroesData | null
): Map<number, number> {
  const competingCounts = new Map<number, number>();
  
  if (!heroesData || !heroesData.heroes) {
    return competingCounts;
  }

  // Get current player's account_id if available
  const currentPlayerAccountId = privatePlayer?.player_slot 
    ? players.find(p => p.player_slot === privatePlayer.player_slot)?.account_id
    : null;

  // Get all unique heroes in the build
  const buildHeroIds = new Set(build.units.map(u => u.unit_id));

  // For each hero in the build, count how many other players have it
  for (const unitId of buildHeroIds) {
    const playersUsingHero = new Set<number>();
    
    for (const player of players) {
      // Skip current player
      if (currentPlayerAccountId && player.account_id === currentPlayerAccountId) {
        continue;
      }
      
      // Check if this player has this hero
      if (player.units && player.units.some(u => u.unit_id === unitId)) {
        playersUsingHero.add(player.account_id);
      }
    }
    
    competingCounts.set(unitId, playersUsingHero.size);
  }

  return competingCounts;
}

/**
 * Get target rank and copies needed based on hero tier
 * - Tier 1-3: Target rank 3 (needs 9 copies)
 * - Tier 4-5: Target rank 2 (needs 3 copies)
 */
function getTargetRankInfo(tier: number): { targetRank: number; copiesNeeded: number } {
  if (tier <= 3) {
    return { targetRank: 3, copiesNeeded: 9 };
  }
  return { targetRank: 2, copiesNeeded: 3 };
}

/**
 * Calculate hero score for a single hero in a build
 * 
 * Simplified formula: feasibility × competitionPenalty
 * - Feasibility: Can we reach the target rank? (remainingPool / copiesNeeded, capped at 1.0)
 * - Competition: How many other players are using this hero? (1 / (1 + competitors))
 */
function calculateHeroScore(
  unitId: number,
  buildUnit: BuildUnit,
  poolCount: PoolCount | undefined,
  competingPlayers: number,
  heroesData: HeroesData | null
): HeroScore {
  if (!poolCount || !heroesData || !heroesData.heroes) {
    return {
      unitId,
      availability: 0,
      competition: competingPlayers,
      canRank3: false,
      score: 0,
    };
  }

  const heroData = Object.values(heroesData.heroes).find(h => h.id === unitId);
  const tier = heroData?.draftTier || 1;
  const { copiesNeeded } = getTargetRankInfo(tier);

  // Availability: Percentage of total pool that is remaining (0-1)
  // This shows actual pool availability, not just whether we can reach target
  const availability = poolCount.total > 0 
    ? poolCount.remaining / poolCount.total 
    : 0;

  // Competition is the PRIMARY concern - if there are competitors, score is heavily penalized
  // 0 competitors: 1.0 (no penalty, full score)
  // 1 competitor: 0.3 (70% penalty - significant impact)
  // 2 competitors: 0.15 (85% penalty - very difficult)
  // 3+ competitors: 0.05 (95% penalty - nearly impossible)
  let competitionPenalty: number;
  if (competingPlayers === 0) {
    competitionPenalty = 1.0;
  } else if (competingPlayers === 1) {
    competitionPenalty = 0.3;
  } else if (competingPlayers === 2) {
    competitionPenalty = 0.15;
  } else {
    competitionPenalty = 0.05;
  }

  // Hero score: Competition is the primary factor
  // Score = availability × competitionPenalty
  // This means even if 100% available, competition heavily reduces the score
  const score = availability * competitionPenalty;

  // Check if target rank is achievable
  // Tier 1-3: can reach rank 3 if 9+ copies available
  // Tier 4-5: can reach rank 2 if 3+ copies available
  const canRank3 = poolCount.remaining >= copiesNeeded;

  return {
    unitId,
    availability: availability, // Actual pool availability percentage (0-1)
    competition: competingPlayers,
    canRank3,
    score: Math.min(score, 1.0), // Cap score at 1.0
  };
}

/**
 * Calculate build suggestion score for a single build
 */
export function calculateBuildSuggestion(
  build: Build,
  players: PlayerState[],
  privatePlayer: PrivatePlayerState | null,
  poolCounts: Map<number, PoolCount>,
  heroesData: HeroesData | null
): BuildSuggestion {
  if (!heroesData || build.units.length === 0) {
    return {
      build,
      score: 0,
      heroScores: new Map(),
      canAchieveRank3: false,
      competingPlayers: new Map(),
    };
  }

  // Count competing players for each hero
  const competingPlayers = countCompetingPlayers(build, players, privatePlayer, heroesData);

  // Calculate scores for each UNIQUE hero in the build (not per unit instance)
  // A build might have the same hero multiple times, but we only score it once
  const uniqueHeroIds = new Set(build.units.map(u => u.unit_id));
  const heroScores = new Map<number, HeroScore>();
  let totalScore = 0;
  let canAchieveAllTargetRanks = true;

  for (const unitId of uniqueHeroIds) {
    const poolCount = poolCounts.get(unitId);
    const competition = competingPlayers.get(unitId) || 0;
    
    // Get first build unit with this ID for tier calculation
    const buildUnit = build.units.find(u => u.unit_id === unitId);
    if (!buildUnit) continue;

    const heroScore = calculateHeroScore(
      unitId,
      buildUnit,
      poolCount,
      competition,
      heroesData
    );

    heroScores.set(unitId, heroScore);
    totalScore += heroScore.score;

    // Check if this hero can achieve its target rank
    // Tier 1-3: target is rank 3, Tier 4-5: target is rank 2
    if (!heroScore.canRank3) {
      canAchieveAllTargetRanks = false;
    }
  }

  // Build score: Average of all unique hero scores
  // Higher score = more available heroes with less competition
  const averageScore = uniqueHeroIds.size > 0 ? totalScore / uniqueHeroIds.size : 0;

  return {
    build,
    score: averageScore,
    heroScores,
    canAchieveRank3: canAchieveAllTargetRanks,
    competingPlayers,
  };
}

/**
 * Calculate build suggestions for all saved builds
 */
export function calculateBuildSuggestions(
  builds: Build[],
  players: PlayerState[],
  privatePlayer: PrivatePlayerState | null,
  poolCounts: Map<number, PoolCount>,
  heroesData: HeroesData | null
): BuildSuggestion[] {
  if (!heroesData || builds.length === 0 || poolCounts.size === 0) {
    return [];
  }

  const suggestions = builds.map(build =>
    calculateBuildSuggestion(build, players, privatePlayer, poolCounts, heroesData)
  );

  // Sort by score descending (best builds first)
  suggestions.sort((a, b) => b.score - a.score);

  return suggestions;
}

