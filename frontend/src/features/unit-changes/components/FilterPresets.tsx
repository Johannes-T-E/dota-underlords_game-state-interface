import React from 'react';
import { Text as UIText, Button } from '@/components/ui';
import './FilterPresets.css';

export interface FilterPreset {
  id: string;
  label: string;
  filters: {
    bought?: boolean;
    sold?: boolean;
    upgraded?: boolean;
    benched?: boolean;
    deployed?: boolean;
    reposition?: boolean;
    organize_bench?: boolean;
    reroll?: boolean;
    xp_purchase?: boolean;
    level_up?: boolean;
    hp_change?: boolean;
    item_added?: boolean;
    item_assigned?: boolean;
    item_unassigned?: boolean;
    item_reassigned?: boolean;
    synergy_added?: boolean;
    synergy_removed?: boolean;
    synergy_level_changed?: boolean;
  };
}

const PRESETS: FilterPreset[] = [
  {
    id: 'all-unit-actions',
    label: 'All Unit Actions',
    filters: {
      bought: true,
      sold: true,
      upgraded: true,
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
  },
  {
    id: 'all-items',
    label: 'All Items',
    filters: {
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
      item_added: true,
      item_assigned: true,
      item_unassigned: true,
      item_reassigned: true,
      synergy_added: false,
      synergy_removed: false,
      synergy_level_changed: false,
    }
  },
  {
    id: 'all-synergies',
    label: 'All Synergies',
    filters: {
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
      synergy_added: true,
      synergy_removed: true,
      synergy_level_changed: true,
    }
  },
  {
    id: 'all-movement',
    label: 'All Movement',
    filters: {
      bought: false,
      sold: false,
      upgraded: false,
      benched: true,
      deployed: true,
      reposition: true,
      organize_bench: true,
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
  },
  {
    id: 'all-player-actions',
    label: 'All Player Actions',
    filters: {
      bought: false,
      sold: false,
      upgraded: false,
      benched: false,
      deployed: false,
      reposition: false,
      organize_bench: false,
      reroll: true,
      xp_purchase: true,
      level_up: true,
      hp_change: true,
      item_added: false,
      item_assigned: false,
      item_unassigned: false,
      item_reassigned: false,
      synergy_added: false,
      synergy_removed: false,
      synergy_level_changed: false,
    }
  },
];

export interface FilterPresetsProps {
  onPresetSelect: (preset: FilterPreset) => void;
}

export const FilterPresets: React.FC<FilterPresetsProps> = ({ onPresetSelect }) => {
  return (
    <div className="filter-presets">
      <UIText variant="label" className="filter-presets__title">
        Quick Presets
      </UIText>
      <div className="filter-presets__buttons">
        {PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="secondary"
            size="small"
            onClick={() => onPresetSelect(preset)}
            className="filter-presets__button"
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

