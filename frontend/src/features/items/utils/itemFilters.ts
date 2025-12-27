import type { ItemData } from '@/utils/itemHelpers';
import { getItemName } from '@/components/ui/ItemDisplay/utils';
import type { ItemsLocalization } from '../hooks/useItemsLocalization';

export type SortOption = 'name-asc' | 'name-desc' | 'tier-asc' | 'tier-desc' | 'type-asc' | 'type-desc';
export type ViewMode = 'grid' | 'table';

export interface ItemFilters {
  searchQuery: string;
  selectedTiers: Set<number>;
  selectedTypes: Set<string>;
  sortBy: SortOption;
  viewMode: ViewMode;
  tierFilterMode?: 'AND' | 'OR';
  typeFilterMode?: 'AND' | 'OR';
}

/**
 * Filter items based on search query, tier, and type filters
 */
export function filterItems(
  items: ItemData[],
  filters: ItemFilters,
  itemsLocalization: ItemsLocalization | null
): ItemData[] {
  let filtered = [...items];

  // Search filter (name)
  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(item => {
      const itemName = getItemName(item.id, item.displayName, itemsLocalization).toLowerCase();
      if (itemName.includes(query)) {
        return true;
      }

      // Search in tier
      if (item.tier !== undefined && (query === `tier ${item.tier}` || query === `t${item.tier}`)) {
        return true;
      }

      // Search in type
      if (item.type && item.type.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });
  }

  // Tier filter
  if (filters.selectedTiers.size > 0) {
    if (filters.tierFilterMode === 'AND') {
      // All selected tiers must match (not applicable for single item, so use OR logic)
      filtered = filtered.filter(item => 
        item.tier !== undefined && filters.selectedTiers.has(item.tier)
      );
    } else {
      // OR mode: item must have at least one of the selected tiers
      filtered = filtered.filter(item => 
        item.tier !== undefined && filters.selectedTiers.has(item.tier)
      );
    }
  }

  // Type filter
  if (filters.selectedTypes.size > 0) {
    if (filters.typeFilterMode === 'AND') {
      // All selected types must match (not applicable for single item, so use OR logic)
      filtered = filtered.filter(item => 
        item.type && filters.selectedTypes.has(item.type)
      );
    } else {
      // OR mode: item must have at least one of the selected types
      filtered = filtered.filter(item => 
        item.type && filters.selectedTypes.has(item.type)
      );
    }
  }

  return filtered;
}

/**
 * Sort items by name, tier, or type
 */
export function sortItems(items: ItemData[], sortBy: SortOption, itemsLocalization: ItemsLocalization | null): ItemData[] {
  const sorted = [...items];

  switch (sortBy) {
    case 'name-asc':
      sorted.sort((a, b) => {
        const nameA = getItemName(a.id, a.displayName, itemsLocalization);
        const nameB = getItemName(b.id, b.displayName, itemsLocalization);
        return nameA.localeCompare(nameB);
      });
      break;
    case 'name-desc':
      sorted.sort((a, b) => {
        const nameA = getItemName(a.id, a.displayName, itemsLocalization);
        const nameB = getItemName(b.id, b.displayName, itemsLocalization);
        return nameB.localeCompare(nameA);
      });
      break;
    case 'tier-asc':
      sorted.sort((a, b) => {
        const tierA = a.tier ?? 0;
        const tierB = b.tier ?? 0;
        return tierA - tierB;
      });
      break;
    case 'tier-desc':
      sorted.sort((a, b) => {
        const tierA = a.tier ?? 0;
        const tierB = b.tier ?? 0;
        return tierB - tierA;
      });
      break;
    case 'type-asc':
      sorted.sort((a, b) => {
        const typeA = a.type || '';
        const typeB = b.type || '';
        return typeA.localeCompare(typeB);
      });
      break;
    case 'type-desc':
      sorted.sort((a, b) => {
        const typeA = a.type || '';
        const typeB = b.type || '';
        return typeB.localeCompare(typeA);
      });
      break;
  }

  return sorted;
}

/**
 * Apply both filtering and sorting
 */
export function getFilteredAndSortedItems(
  items: ItemData[],
  filters: ItemFilters,
  itemsLocalization: ItemsLocalization | null
): ItemData[] {
  const filtered = filterItems(items, filters, itemsLocalization);
  return sortItems(filtered, filters.sortBy, itemsLocalization);
}

