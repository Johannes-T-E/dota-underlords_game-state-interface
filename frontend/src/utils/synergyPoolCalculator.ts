import type { PlayerState } from '@/types';
import type { HeroesData } from './heroHelpers';
import type { PoolCount } from './poolCalculator';
import { cardsPerTier } from './poolCalculator';
import { getSynergyNameByKeyword } from '@/components/ui/SynergyDisplay/utils';
import keywordMappings from '@/components/ui/SynergyDisplay/data/synergy-keyword-mappings.json';

// Inactive synergies (Mega synergies and Primordial)
const INACTIVE_SYNERGY_KEYWORDS = [26, 28, 29, 31, 32, 33];

export interface SynergyPoolStat {
  keyword: number;
  synergyName: string;
  totalPool: number;
  remainingPool: number;
  usedPool: number;
  percentageRemaining: number;
}

/**
 * Special case mappings for hero keyword strings to synergy names
 */
const KEYWORD_NAME_MAPPINGS: Record<string, string> = {
  'scaled': 'Naga',
  'heartless': 'Undead',
  'brute': 'Brutal',
};

/**
 * Parse hero keywords string to array of keyword numbers
 * Handles special cases like "scaled" → "Naga", "heartless" → "Undead", "brute" → "Brutal"
 */
function parseHeroKeywords(
  keywordsString: string,
  reverseMappings: Record<string, number>
): number[] {
  if (!keywordsString || keywordsString.trim() === '') {
    return [];
  }

  const keywords: number[] = [];
  const words = keywordsString.trim().split(/\s+/);

  for (const word of words) {
    // Apply special case mappings first
    const mappedName = KEYWORD_NAME_MAPPINGS[word.toLowerCase()];
    const synergyName = mappedName || (word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    
    // Look up in reverse_mappings
    const keyword = reverseMappings[synergyName];
    if (keyword !== undefined) {
      keywords.push(keyword);
    }
  }

  return keywords;
}

/**
 * Calculate synergy pool statistics grouped by synergy keyword
 * 
 * @param players - Array of all player states
 * @param heroesData - Heroes data to get hero information
 * @param poolCounts - Map of unit_id -> PoolCount (from calculatePoolCounts)
 * @returns Array of SynergyPoolStat objects sorted by remainingPool descending
 */
export function calculateSynergyPoolStats(
  players: PlayerState[],
  heroesData: HeroesData | null,
  poolCounts: Map<number, PoolCount>
): SynergyPoolStat[] {
  if (!heroesData || !heroesData.heroes) {
    return [];
  }

  const reverseMappings = keywordMappings.reverse_mappings as Record<string, number>;

  // Step 1: Build hero-to-keywords mapping
  const heroKeywordsMap = new Map<number, number[]>();
  
  for (const [, heroData] of Object.entries(heroesData.heroes)) {
    const unitId = heroData.id;
    const keywords = parseHeroKeywords(heroData.keywords, reverseMappings);
    heroKeywordsMap.set(unitId, keywords);
  }

  // Step 2: Calculate total pool per synergy
  const synergyStats = new Map<number, {
    totalPool: number;
    remainingPool: number;
  }>();

  // Initialize all synergies from reverse_mappings
  for (const [synergyName, keyword] of Object.entries(reverseMappings)) {
    if (INACTIVE_SYNERGY_KEYWORDS.includes(keyword)) {
      continue; // Skip inactive synergies
    }
    synergyStats.set(keyword, { totalPool: 0, remainingPool: 0 });
  }

  // Calculate total pool for each synergy
  for (const [, heroData] of Object.entries(heroesData.heroes)) {
    const unitId = heroData.id;
    const tier = heroData.draftTier;
    const keywords = heroKeywordsMap.get(unitId) || [];
    const totalPool = cardsPerTier[String(tier) as keyof typeof cardsPerTier] || 0;

    // Add this hero's pool to each of its synergies
    for (const keyword of keywords) {
      if (INACTIVE_SYNERGY_KEYWORDS.includes(keyword)) {
        continue; // Skip inactive synergies
      }
      
      const stat = synergyStats.get(keyword);
      if (stat) {
        stat.totalPool += totalPool;
      }
    }
  }

  // Step 3: Calculate used/remaining pool per synergy
  for (const [, heroData] of Object.entries(heroesData.heroes)) {
    const unitId = heroData.id;
    const keywords = heroKeywordsMap.get(unitId) || [];
    const poolCount = poolCounts.get(unitId);

    if (!poolCount) {
      continue;
    }

    // Add this hero's remaining pool to each of its synergies
    for (const keyword of keywords) {
      if (INACTIVE_SYNERGY_KEYWORDS.includes(keyword)) {
        continue; // Skip inactive synergies
      }
      
      const stat = synergyStats.get(keyword);
      if (stat) {
        stat.remainingPool += poolCount.remaining;
      }
    }
  }

  // Convert to array and calculate percentages
  const result: SynergyPoolStat[] = [];
  
  for (const [keyword, stat] of synergyStats.entries()) {
    // Only include synergies that have heroes (totalPool > 0)
    if (stat.totalPool === 0) {
      continue;
    }

    const usedPool = stat.totalPool - stat.remainingPool;
    const percentageRemaining = stat.totalPool > 0 
      ? (stat.remainingPool / stat.totalPool) * 100 
      : 0;
    
    const synergyName = getSynergyNameByKeyword(keyword) || 'Unknown';
    
    result.push({
      keyword,
      synergyName,
      totalPool: stat.totalPool,
      remainingPool: stat.remainingPool,
      usedPool,
      percentageRemaining,
    });
  }

  // Sort by remainingPool descending (most available first)
  result.sort((a, b) => b.remainingPool - a.remainingPool);

  return result;
}

