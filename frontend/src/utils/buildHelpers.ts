import type { Build, BuildStats, Synergy, BuildUnit } from '@/types';
import type { HeroesData } from './heroHelpers';

export const MAX_BUILD_UNITS = 10;

/**
 * Validate a build
 */
export function validateBuild(build: Build): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!build.name || build.name.trim() === '') {
    errors.push('Build name is required');
  }

  if (build.units.length > MAX_BUILD_UNITS) {
    errors.push(`Build cannot have more than ${MAX_BUILD_UNITS} units`);
  }

  // Check for duplicate positions
  const positions = new Set<string>();
  for (const unit of build.units) {
    const posKey = `${unit.position.x},${unit.position.y}`;
    if (positions.has(posKey)) {
      errors.push(`Multiple units at position (${unit.position.x}, ${unit.position.y})`);
    }
    positions.add(posKey);
  }

  // Validate positions are within bounds
  for (const unit of build.units) {
    if (unit.position.y === -1) {
      // Bench position
      if (unit.position.x < 0 || unit.position.x >= 8) {
        errors.push(`Unit at invalid bench position (${unit.position.x}, ${unit.position.y})`);
      }
    } else {
      // Roster position
      if (unit.position.x < 0 || unit.position.x >= 8 || unit.position.y < 0 || unit.position.y >= 4) {
        errors.push(`Unit at invalid roster position (${unit.position.x}, ${unit.position.y})`);
      }
    }

    // Validate rank
    if (unit.rank < 1 || unit.rank > 3) {
      errors.push(`Unit has invalid rank: ${unit.rank} (must be 1, 2, or 3)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate active synergies for a build
 */
export function calculateBuildSynergies(
  build: Build,
  heroesData: HeroesData | null
): Synergy[] {
  if (!heroesData || !heroesData.heroes || build.units.length === 0) {
    return [];
  }

  // Map to count unique units per keyword, separated by active/bench
  const activeKeywordCounts = new Map<number, Set<number>>();
  const benchKeywordCounts = new Map<number, Set<number>>();

  // For each unit in the build, get its keywords and count unique unit_ids
  for (const buildUnit of build.units) {
    const heroData = Object.values(heroesData.heroes).find(h => h.id === buildUnit.unit_id);
    if (!heroData) {
      continue;
    }

    const keywords = heroData.keywords || [];
    const isBench = buildUnit.position.y === -1;
    const keywordCounts = isBench ? benchKeywordCounts : activeKeywordCounts;

    for (const keyword of keywords) {
      if (!keywordCounts.has(keyword)) {
        keywordCounts.set(keyword, new Set());
      }
      keywordCounts.get(keyword)!.add(buildUnit.unit_id);
    }
  }

  // Combine all keywords (from both active and bench)
  const allKeywords = new Set([
    ...activeKeywordCounts.keys(),
    ...benchKeywordCounts.keys()
  ]);

  // Convert to Synergy array
  const synergies: Synergy[] = [];
  for (const keyword of allKeywords) {
    const activeCount = activeKeywordCounts.get(keyword)?.size || 0;
    const benchCount = benchKeywordCounts.get(keyword)?.size || 0;
    const totalCount = activeCount + benchCount;

    if (totalCount > 0) {
      synergies.push({
        keyword,
        unique_unit_count: activeCount,
        bench_additional_unique_unit_count: benchCount > 0 ? benchCount : undefined,
      });
    }
  }

  return synergies;
}

/**
 * Get build statistics
 */
export function getBuildStats(
  build: Build,
  heroesData: HeroesData | null
): BuildStats {
  if (!heroesData || !heroesData.heroes) {
    return {
      totalCost: 0,
      synergies: [],
      unitCount: build.units.length,
      averageTier: 0,
    };
  }

  let totalCost = 0;
  let totalTier = 0;
  const unitCount = build.units.length;

  for (const buildUnit of build.units) {
    const heroData = Object.values(heroesData.heroes).find(h => h.id === buildUnit.unit_id);
    if (heroData) {
      totalCost += heroData.goldCost;
      totalTier += heroData.draftTier;
    }
  }

  const synergies = calculateBuildSynergies(build, heroesData);
  const averageTier = unitCount > 0 ? totalTier / unitCount : 0;

  return {
    totalCost,
    synergies,
    unitCount,
    averageTier,
  };
}

/**
 * Create a new empty build unit at a position
 */
export function createBuildUnit(
  unitId: number,
  position: { x: number; y: number },
  rank: number = 1
): BuildUnit {
  return {
    unit_id: unitId,
    position,
    rank,
    keywords: [], // Will be populated from hero data
  };
}

