import { useMemo, useState } from 'react';
import { AppLayout, MainContentTemplate } from '@/components/layout';
import { EmptyState } from '@/components/shared';
import { useItemsData } from '@/hooks/useItemsData';
import { useItemsLocalization } from './hooks/useItemsLocalization';
import { ItemFilters } from './components/ItemFilters/ItemFilters';
import { ItemGrid } from './components/ItemGrid/ItemGrid';
import { ItemTable } from './components/ItemTable/ItemTable';
import { getFilteredAndSortedItems, type SortOption, type ViewMode } from './utils/itemFilters';
import { getAllItems } from '@/components/ui/ItemDisplay';
import type { ItemFilters as ItemFiltersType } from './utils/itemFilters';
import './ItemsPage.css';

export const ItemsPage = () => {
  const { itemsData, loaded } = useItemsData();
  const { itemsLocalization, loading: localizationLoading } = useItemsLocalization();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [tierFilterMode, setTierFilterMode] = useState<'AND' | 'OR'>('OR');
  const [typeFilterMode, setTypeFilterMode] = useState<'AND' | 'OR'>('OR');

  // Get all items from both set_base and set_balance (prioritize set_balance)
  const allItems = useMemo(() => {
    if (!itemsData) {
      return [];
    }
    return getAllItems(itemsData);
  }, [itemsData]);

  // Apply filters and sorting
  const filteredItems = useMemo(() => {
    const filters: ItemFiltersType = {
      searchQuery,
      selectedTiers,
      selectedTypes,
      sortBy,
      viewMode,
      tierFilterMode,
      typeFilterMode,
    };
    return getFilteredAndSortedItems(allItems, filters, itemsLocalization);
  }, [allItems, searchQuery, selectedTiers, selectedTypes, sortBy, viewMode, tierFilterMode, typeFilterMode, itemsLocalization]);

  const handleTierToggle = (tier: number) => {
    setSelectedTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) {
        next.delete(tier);
      } else {
        next.add(tier);
      }
      return next;
    });
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTiers(new Set([1, 2, 3, 4, 5]));
    setSelectedTypes(new Set());
  };

  const isLoading = !loaded || localizationLoading;

  return (
    <AppLayout>
      <MainContentTemplate className="items-page" centered={false}>
        <div className="items-page__container">
          <div className="items-page__header">
            <h1 className="items-page__title">Items</h1>
          </div>
          {isLoading ? (
            <div className="items-page__loading">
              <EmptyState
                title="Loading Items..."
                message="Please wait while we load item data."
                showSpinner
              />
            </div>
          ) : (
            <>
              <ItemFilters
                searchQuery={searchQuery}
                selectedTiers={selectedTiers}
                selectedTypes={selectedTypes}
                sortBy={sortBy}
                viewMode={viewMode}
                tierFilterMode={tierFilterMode}
                typeFilterMode={typeFilterMode}
                onSearchChange={setSearchQuery}
                onTierToggle={handleTierToggle}
                onTypeToggle={handleTypeToggle}
                onSortChange={setSortBy}
                onViewModeChange={setViewMode}
                onTierFilterModeChange={setTierFilterMode}
                onTypeFilterModeChange={setTypeFilterMode}
                onClearFilters={handleClearFilters}
              />
              {viewMode === 'grid' ? (
                <ItemGrid
                  items={filteredItems}
                  itemsLocalization={itemsLocalization}
                />
              ) : (
                <ItemTable
                  items={filteredItems}
                  itemsLocalization={itemsLocalization}
                />
              )}
            </>
          )}
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};

