import type { HeroData } from '@/utils/heroHelpers';
import { getSynergyNameByKeyword } from '@/components/ui/SynergyDisplay/utils';

export type SortOption = 'name-asc' | 'name-desc' | 'tier-asc' | 'tier-desc';
export type ViewMode = 'grid' | 'table';

export interface HeroFilters {
  searchQuery: string;
  selectedTiers: Set<number>;
  selectedSynergies: Set<number>;
  sortBy: SortOption;
  viewMode: ViewMode;
  tierFilterMode?: 'AND' | 'OR';
  synergyFilterMode?: 'AND' | 'OR';
}

/**
 * Filter heroes based on search query, tier, and synergy filters
 */
export function filterHeroes(
  heroes: HeroData[],
  filters: HeroFilters
): HeroData[] {
  let filtered = [...heroes];

  // Search filter (name, alliance/synergy)
  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(hero => {
      // Search in hero name
      const heroName = hero.displayName?.toLowerCase() || hero.dota_unit_name?.toLowerCase() || '';
      if (heroName.includes(query)) {
        return true;
      }

      // Search in synergy names
      if (hero.keywords && hero.keywords.length > 0) {
        for (const keyword of hero.keywords) {
          const synergyName = getSynergyNameByKeyword(keyword);
          if (synergyName && synergyName.toLowerCase().includes(query)) {
            return true;
          }
        }
      }

      // Search in tier
      if (query === `tier ${hero.draftTier}` || query === `t${hero.draftTier}`) {
        return true;
      }

      return false;
    });
  }

  // Tier filter
  if (filters.selectedTiers.size > 0) {
    filtered = filtered.filter(hero => filters.selectedTiers.has(hero.draftTier));
  }

  // Synergy filter
  if (filters.selectedSynergies.size > 0) {
    filtered = filtered.filter(hero => {
      if (!hero.keywords || hero.keywords.length === 0) {
        return false;
      }
      // Hero must have at least one of the selected synergies
      return hero.keywords.some(keyword => filters.selectedSynergies.has(keyword));
    });
  }

  return filtered;
}

/**
 * Sort heroes by name or tier
 */
export function sortHeroes(heroes: HeroData[], sortBy: SortOption): HeroData[] {
  const sorted = [...heroes];

  switch (sortBy) {
    case 'name-asc':
      sorted.sort((a, b) => {
        const nameA = a.displayName || a.dota_unit_name || '';
        const nameB = b.displayName || b.dota_unit_name || '';
        return nameA.localeCompare(nameB);
      });
      break;
    case 'name-desc':
      sorted.sort((a, b) => {
        const nameA = a.displayName || a.dota_unit_name || '';
        const nameB = b.displayName || b.dota_unit_name || '';
        return nameB.localeCompare(nameA);
      });
      break;
    case 'tier-asc':
      sorted.sort((a, b) => a.draftTier - b.draftTier);
      break;
    case 'tier-desc':
      sorted.sort((a, b) => b.draftTier - a.draftTier);
      break;
  }

  return sorted;
}

/**
 * Apply both filtering and sorting
 */
export function getFilteredAndSortedHeroes(
  heroes: HeroData[],
  filters: HeroFilters
): HeroData[] {
  const filtered = filterHeroes(heroes, filters);
  return sortHeroes(filtered, filters.sortBy);
}

