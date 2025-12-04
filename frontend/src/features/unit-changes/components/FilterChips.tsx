import React, { useMemo } from 'react';
import { Text as UIText } from '@/components/ui';
import type { PlayerState } from '@/types';
import './FilterChips.css';

export interface FilterChip {
  id: string;
  label: string;
  category: string;
  onRemove: () => void;
}

export interface FilterChipsProps {
  validPlayers: PlayerState[];
  selectedPlayerIds: Set<number>;
  onPlayerRemove: (accountId: number) => void;
  onClearAllPlayers: () => void;
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
  onFilterRemove: (filterType: keyof FilterChipsProps['changeFilters']) => void;
  onClearAllFilters: () => void;
}

const FILTER_LABELS: Record<string, string> = {
  bought: 'Bought',
  sold: 'Sold',
  upgraded: 'Upgraded',
  benched: 'Benched',
  deployed: 'Deployed',
  reposition: 'Reposition',
  organize_bench: 'Organize Bench',
  reroll: 'Reroll',
  xp_purchase: 'XP Purchase',
  level_up: 'Level Up',
  hp_change: 'HP Change',
  item_added: 'Item Added',
  item_assigned: 'Item Assigned',
  item_unassigned: 'Item Unassigned',
  item_reassigned: 'Item Reassigned',
  synergy_added: 'Synergy Added',
  synergy_removed: 'Synergy Removed',
  synergy_level_changed: 'Synergy Level Changed',
};

const FILTER_CATEGORIES: Record<string, string> = {
  bought: 'Unit Actions',
  sold: 'Unit Actions',
  upgraded: 'Unit Actions',
  benched: 'Movement',
  deployed: 'Movement',
  reposition: 'Movement',
  organize_bench: 'Movement',
  reroll: 'Player Actions',
  xp_purchase: 'Player Actions',
  level_up: 'Player Actions',
  hp_change: 'Player Actions',
  item_added: 'Items',
  item_assigned: 'Items',
  item_unassigned: 'Items',
  item_reassigned: 'Items',
  synergy_added: 'Synergies',
  synergy_removed: 'Synergies',
  synergy_level_changed: 'Synergies',
};

export const FilterChips: React.FC<FilterChipsProps> = ({
  validPlayers,
  selectedPlayerIds,
  onPlayerRemove,
  onClearAllPlayers,
  changeFilters,
  onFilterRemove,
  onClearAllFilters
}) => {
  const activeFilters = useMemo(() => {
    const chips: FilterChip[] = [];

    // Player chips
    if (selectedPlayerIds.size > 0 && selectedPlayerIds.size < validPlayers.length) {
      validPlayers.forEach((player) => {
        if (selectedPlayerIds.has(player.account_id)) {
          const playerName = player.persona_name || player.bot_persona_name || `Player ${player.account_id}`;
          chips.push({
            id: `player-${player.account_id}`,
            label: playerName,
            category: 'Players',
            onRemove: () => onPlayerRemove(player.account_id)
          });
        }
      });
    }

    // Filter type chips (only show if "all" is false)
    if (!changeFilters.all) {
      Object.entries(changeFilters).forEach(([key, value]) => {
        if (key !== 'all' && value && FILTER_LABELS[key]) {
          chips.push({
            id: `filter-${key}`,
            label: FILTER_LABELS[key],
            category: FILTER_CATEGORIES[key] || 'Other',
            onRemove: () => onFilterRemove(key as keyof typeof changeFilters)
          });
        }
      });
    }

    return chips;
  }, [validPlayers, selectedPlayerIds, changeFilters, onPlayerRemove, onFilterRemove]);

  // Group chips by category - must be called before early return
  const chipsByCategory = useMemo(() => {
    const grouped: Record<string, FilterChip[]> = {};
    activeFilters.forEach((chip) => {
      if (!grouped[chip.category]) {
        grouped[chip.category] = [];
      }
      grouped[chip.category].push(chip);
    });
    return grouped;
  }, [activeFilters]);

  const hasActiveFilters = activeFilters.length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  const canClearAll = activeFilters.length > 0;

  return (
    <div className="filter-chips">
      <div className="filter-chips__header">
        <div className="filter-chips__header-left">
          <UIText variant="label" className="filter-chips__title">
            Active Filters
          </UIText>
          <span className="filter-chips__count">
            {activeFilters.length}
          </span>
        </div>
        {canClearAll && (
          <button
            className="filter-chips__clear-all"
            onClick={() => {
              onClearAllFilters();
              onClearAllPlayers();
            }}
            title="Clear all filters"
          >
            Clear All
          </button>
        )}
      </div>
      <div className="filter-chips__container">
        {Object.entries(chipsByCategory).map(([category, chips]) => (
          <div key={category} className="filter-chips__category">
            {chips.map((chip) => (
              <div key={chip.id} className="filter-chip">
                <span className="filter-chip__label">{chip.label}</span>
                <button
                  className="filter-chip__remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    chip.onRemove();
                  }}
                  title={`Remove ${chip.label} filter`}
                  aria-label={`Remove ${chip.label} filter`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

