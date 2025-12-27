import { useMemo } from 'react';
import { getTierColor } from '@/utils/tierColors';
import type { SortOption, ViewMode } from '../../utils/itemFilters';
import './ItemFilters.css';

export interface ItemFiltersProps {
  searchQuery: string;
  selectedTiers: Set<number>;
  selectedTypes: Set<string>;
  sortBy: SortOption;
  viewMode: ViewMode;
  tierFilterMode: 'AND' | 'OR';
  typeFilterMode: 'AND' | 'OR';
  onSearchChange: (query: string) => void;
  onTierToggle: (tier: number) => void;
  onTypeToggle: (type: string) => void;
  onSortChange: (sort: SortOption) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onTierFilterModeChange: (mode: 'AND' | 'OR') => void;
  onTypeFilterModeChange: (mode: 'AND' | 'OR') => void;
  onClearFilters: () => void;
}

const ITEM_TYPES = [
  { value: 'equipment_offensive', label: 'Offensive' },
  { value: 'equipment_defensive', label: 'Defensive' },
  { value: 'equipment_support', label: 'Support' },
];

export const ItemFilters = ({
  searchQuery,
  selectedTiers,
  selectedTypes,
  sortBy,
  viewMode,
  tierFilterMode,
  typeFilterMode,
  onSearchChange,
  onTierToggle,
  onTypeToggle,
  onSortChange,
  onViewModeChange,
  onTierFilterModeChange,
  onTypeFilterModeChange,
  onClearFilters,
}: ItemFiltersProps) => {
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      selectedTiers.size > 0 ||
      selectedTypes.size > 0
    );
  }, [searchQuery, selectedTiers, selectedTypes]);

  return (
    <div className="item-filters">
      <div className="item-filters__row item-filters__row--main">
        <div className="item-filters__search">
          <input
            type="text"
            className="item-filters__search-input"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="item-filters__control-group">
          <label className="item-filters__label">Sort:</label>
          <select
            className="item-filters__select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="tier-asc">Tier (1-5)</option>
            <option value="tier-desc">Tier (5-1)</option>
            <option value="type-asc">Type (A-Z)</option>
            <option value="type-desc">Type (Z-A)</option>
          </select>
        </div>

        <div className="item-filters__actions">
          {hasActiveFilters && (
            <button
              type="button"
              className="item-filters__clear-button"
              onClick={onClearFilters}
            >
              Clear All Filters
            </button>
          )}
          <div className="item-filters__view-toggle">
            <button
              type="button"
              className={`item-filters__view-button ${viewMode === 'grid' ? 'item-filters__view-button--active' : ''}`}
              onClick={() => onViewModeChange('grid')}
              title="Grid View"
            >
              ▦
            </button>
            <button
              type="button"
              className={`item-filters__view-button ${viewMode === 'table' ? 'item-filters__view-button--active' : ''}`}
              onClick={() => onViewModeChange('table')}
              title="Table View"
            >
              ☷
            </button>
          </div>
        </div>
      </div>

      <div className="item-filters__row item-filters__row--filters">
        {/* Tier filter */}
        <div className="item-filters__tier-filter">
          <div className="item-filters__filter-header">
            <label>Tier:</label>
            <div className="item-filters__filter-mode-toggle">
              <button
                type="button"
                className={`item-filters__mode-button ${
                  tierFilterMode === 'OR' ? 'item-filters__mode-button--active' : ''
                }`}
                onClick={() => onTierFilterModeChange('OR')}
                title="OR: Show items matching any selected tier"
              >
                OR
              </button>
              <button
                type="button"
                className={`item-filters__mode-button ${
                  tierFilterMode === 'AND' ? 'item-filters__mode-button--active' : ''
                }`}
                onClick={() => onTierFilterModeChange('AND')}
                title="AND: Show items matching all selected tiers"
              >
                AND
              </button>
            </div>
          </div>
          <div className="item-filters__tier-buttons">
            {[1, 2, 3, 4, 5].map(tier => {
              const isActive = selectedTiers.has(tier);
              const tierColor = getTierColor(tier);
              return (
                <button
                  key={tier}
                  type="button"
                  className={`item-filters__tier-button ${
                    isActive ? 'item-filters__tier-button--active' : ''
                  }`}
                  onClick={() => onTierToggle(tier)}
                  style={isActive ? {
                    color: tierColor,
                    textShadow: `0 0 2px ${tierColor}, 0 0 4px ${tierColor}`,
                  } : {}}
                  title={`Tier ${tier}`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
        </div>

        {/* Type filter */}
        <div className="item-filters__type-filter">
          <div className="item-filters__filter-header">
            <label>Type:</label>
            <div className="item-filters__filter-mode-toggle">
              <button
                type="button"
                className={`item-filters__mode-button ${
                  typeFilterMode === 'OR' ? 'item-filters__mode-button--active' : ''
                }`}
                onClick={() => onTypeFilterModeChange('OR')}
                title="OR: Show items matching any selected type"
              >
                OR
              </button>
              <button
                type="button"
                className={`item-filters__mode-button ${
                  typeFilterMode === 'AND' ? 'item-filters__mode-button--active' : ''
                }`}
                onClick={() => onTypeFilterModeChange('AND')}
                title="AND: Show items matching all selected types"
              >
                AND
              </button>
            </div>
          </div>
          <div className="item-filters__type-buttons">
            {ITEM_TYPES.map(({ value, label }) => {
              const isActive = selectedTypes.has(value);
              return (
                <button
                  key={value}
                  type="button"
                  className={`item-filters__type-button ${
                    isActive ? 'item-filters__type-button--active' : ''
                  }`}
                  onClick={() => onTypeToggle(value)}
                  title={label}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

