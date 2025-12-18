import React, { useState, useMemo } from 'react';
import { Text as UIText } from '@/components/ui';
import type { PlayerState } from '@/types';
import './ChangeFilters.css';

export interface ChangeFiltersProps {
  validPlayers: PlayerState[];
  selectedPlayerIds: Set<number>;
  onPlayerToggle: (accountId: number) => void;
  onSelectAllPlayers: () => void;
  changeFilters: {
    all: boolean;
    bought: boolean;
    sold: boolean;
    upgraded: boolean;
    benched: boolean;
    deployed: boolean;
    reposition: boolean;
    organize_bench: boolean;
    reroll: boolean;
    xp_purchase: boolean;
    level_up: boolean;
    hp_change: boolean;
    item_added: boolean;
    item_assigned: boolean;
    item_unassigned: boolean;
    item_reassigned: boolean;
    synergy_added: boolean;
    synergy_removed: boolean;
    synergy_level_changed: boolean;
  };
  onFilterChange: (filterType: keyof ChangeFiltersProps['changeFilters']) => void;
  onPresetSelect?: (preset: any) => void;
}

interface FilterOption {
  key: keyof ChangeFiltersProps['changeFilters'];
  label: string;
  category: string;
  icon?: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  // Unit Actions
  { key: 'bought', label: 'Bought', category: 'Unit Actions' },
  { key: 'sold', label: 'Sold', category: 'Unit Actions' },
  { key: 'upgraded', label: 'Upgraded', category: 'Unit Actions' },
  // Movement
  { key: 'benched', label: 'Benched', category: 'Movement' },
  { key: 'deployed', label: 'Deployed', category: 'Movement' },
  { key: 'reposition', label: 'Reposition', category: 'Movement' },
  { key: 'organize_bench', label: 'Organize Bench', category: 'Movement' },
  // Player Actions
  { key: 'reroll', label: 'Reroll', category: 'Player Actions' },
  { key: 'xp_purchase', label: 'XP Purchase', category: 'Player Actions' },
  { key: 'level_up', label: 'Level Up', category: 'Player Actions' },
  { key: 'hp_change', label: 'HP Change', category: 'Player Actions' },
  // Items
  { key: 'item_added', label: 'Item Added', category: 'Items' },
  { key: 'item_assigned', label: 'Item Assigned', category: 'Items' },
  { key: 'item_unassigned', label: 'Item Unassigned', category: 'Items' },
  { key: 'item_reassigned', label: 'Item Reassigned', category: 'Items' },
  // Synergies
  { key: 'synergy_added', label: 'Synergy Added', category: 'Synergies' },
  { key: 'synergy_removed', label: 'Synergy Removed', category: 'Synergies' },
  { key: 'synergy_level_changed', label: 'Synergy Level Changed', category: 'Synergies' },
];

const PRESETS = [
  { id: 'all-unit-actions', label: 'Unit Actions', filters: ['bought', 'sold', 'upgraded'] },
  { id: 'all-movement', label: 'Movement', filters: ['benched', 'deployed', 'reposition', 'organize_bench'] },
  { id: 'all-player-actions', label: 'Player Actions', filters: ['reroll', 'xp_purchase', 'level_up', 'hp_change'] },
  { id: 'all-items', label: 'Items', filters: ['item_added', 'item_assigned', 'item_unassigned', 'item_reassigned'] },
  { id: 'all-synergies', label: 'Synergies', filters: ['synergy_added', 'synergy_removed', 'synergy_level_changed'] },
];

export const ChangeFilters: React.FC<ChangeFiltersProps> = ({
  validPlayers,
  selectedPlayerIds,
  onPlayerToggle,
  onSelectAllPlayers,
  changeFilters,
  onFilterChange,
  onPresetSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');

  const allPlayersSelected = selectedPlayerIds.size === validPlayers.length && validPlayers.length > 0;

  // Filter players by search
  const filteredPlayers = useMemo(() => {
    if (!playerSearch.trim()) {
      return validPlayers;
    }
    const searchLower = playerSearch.toLowerCase();
    return validPlayers.filter((player) => {
      const name = (player.persona_name || player.bot_persona_name || `Player ${player.account_id}`).toLowerCase();
      return name.includes(searchLower);
    });
  }, [validPlayers, playerSearch]);

  // Group filters by category
  const filtersByCategory = useMemo(() => {
    const grouped: Record<string, FilterOption[]> = {};
    FILTER_OPTIONS.forEach((filter) => {
      if (!grouped[filter.category]) {
        grouped[filter.category] = [];
      }
      grouped[filter.category]!.push(filter);
    });
    return grouped;
  }, []);

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    if (!onPresetSelect) return;
    
    // Create a preset object that matches FilterPreset interface
    const presetObj: any = {
      id: preset.id,
      label: preset.label,
      filters: {
        all: false, // Presets disable "all" mode
        bought: false,
        sold: false,
        upgraded: false,
        benched: false,
        deployed: false,
        reposition: false,
        organize_bench: false,
        reroll: false,
        xp_purchase: false,
        level_up: false,
        hp_change: false,
        item_added: false,
        item_assigned: false,
        item_unassigned: false,
        item_reassigned: false,
        synergy_added: false,
        synergy_removed: false,
        synergy_level_changed: false,
      }
    };
    
    // Set preset filters to true
    preset.filters.forEach((filterKey) => {
      if (presetObj.filters.hasOwnProperty(filterKey)) {
        presetObj.filters[filterKey] = true;
      }
    });
    
    onPresetSelect(presetObj);
  };

  const activeFilterCount = useMemo(() => {
    if (changeFilters.all) return 0;
    return Object.values(changeFilters).filter((val, idx) => {
      const key = Object.keys(changeFilters)[idx];
      return key !== 'all' && val === true;
    }).length;
  }, [changeFilters]);

  return (
    <div className="change-filters">
      <div 
        className="change-filters__header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="change-filters__header-left">
          <UIText variant="label" className="change-filters__title">
            Filters
          </UIText>
          {activeFilterCount > 0 && (
            <span className="change-filters__count-badge">
              {activeFilterCount}
            </span>
          )}
        </div>
        <span className={`change-filters__toggle ${isExpanded ? 'change-filters__toggle--open' : ''}`}>
          ▶
        </span>
      </div>

      {isExpanded && (
        <div className="change-filters__content">
          {/* Quick Presets */}
          {onPresetSelect && (
            <div className="change-filters__presets">
              <UIText variant="label" className="change-filters__presets-title">
                Quick Presets
              </UIText>
              <div className="change-filters__presets-chips">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    className="change-filters__preset-chip"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Player Selection */}
          <div className="change-filters__section">
            <div className="change-filters__section-header">
              <UIText variant="label" className="change-filters__section-title">
                Players
              </UIText>
              <button
                className="change-filters__select-all"
                onClick={onSelectAllPlayers}
              >
                {allPlayersSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="change-filters__search">
              <input
                type="text"
                placeholder="Search players..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="change-filters__search-input"
              />
            </div>
            <div className="change-filters__chips">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => {
                  const playerName = player.persona_name || player.bot_persona_name || `Player ${player.account_id}`;
                  const isSelected = selectedPlayerIds.has(player.account_id);
                  return (
                    <button
                      key={player.account_id}
                      className={`change-filters__chip ${isSelected ? 'change-filters__chip--active' : ''}`}
                      onClick={() => onPlayerToggle(player.account_id)}
                    >
                      {playerName}
                    </button>
                  );
                })
              ) : (
                <UIText variant="label" className="change-filters__empty">
                  No players found
                </UIText>
              )}
            </div>
          </div>

          {/* Filter Type Chips */}
          {Object.entries(filtersByCategory).map(([category, filters]) => (
            <div key={category} className="change-filters__section">
              <div className="change-filters__section-header">
                <UIText variant="label" className="change-filters__section-title">
                  {category}
                </UIText>
                <button
                  className="change-filters__select-all"
                  onClick={() => {
                    const allEnabled = filters.every((f) => changeFilters[f.key]);
                    filters.forEach((f) => {
                      if (changeFilters[f.key] === allEnabled) {
                        onFilterChange(f.key);
                      }
                    });
                  }}
                >
                  {filters.every((f) => changeFilters[f.key]) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="change-filters__chips">
                {filters.map((filter) => {
                  const isActive = changeFilters[filter.key];
                  return (
                    <button
                      key={filter.key}
                      className={`change-filters__chip ${isActive ? 'change-filters__chip--active' : ''}`}
                      onClick={() => onFilterChange(filter.key)}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Show All Toggle */}
          <div className="change-filters__section">
            <button
              className={`change-filters__chip change-filters__chip--large ${changeFilters.all ? 'change-filters__chip--active' : ''}`}
              onClick={() => onFilterChange('all')}
            >
              Show All Types
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
