import React from 'react';
import type { Change } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import { UnitBoughtChange } from './changes/UnitBoughtChange';
import { UnitSoldChange } from './changes/UnitSoldChange';
import { UnitUpgradedChange } from './changes/UnitUpgradedChange';
import { UnitBenchedChange } from './changes/UnitBenchedChange';
import { UnitDeployedChange } from './changes/UnitDeployedChange';
import { UnitRepositionChange } from './changes/UnitRepositionChange';
import { ItemAddedChange } from './changes/ItemAddedChange';
import { ItemAssignedChange } from './changes/ItemAssignedChange';
import { ItemUnassignedChange } from './changes/ItemUnassignedChange';
import { ItemReassignedChange } from './changes/ItemReassignedChange';
import { SynergyAddedChange } from './changes/SynergyAddedChange';
import { SynergyRemovedChange } from './changes/SynergyRemovedChange';
import { SynergyLevelChangedChange } from './changes/SynergyLevelChangedChange';
import { RerollChange } from './changes/RerollChange';
import { XpPurchaseChange } from './changes/XpPurchaseChange';
import { LevelUpChange } from './changes/LevelUpChange';
import { HpChangeChange } from './changes/HpChangeChange';

export interface ChangeItemProps {
  change: Change;
  playerName: string;
  timeDisplay: string;
  heroesData: HeroesData | null;
  player?: any; // PlayerState type
}

export const ChangeItem: React.FC<ChangeItemProps> = ({
  change,
  playerName,
  timeDisplay,
  heroesData,
  player
}) => {
  const commonProps = {
    change,
    playerName,
    timeDisplay,
    heroesData,
    player
  };

  switch (change.type) {
    case 'bought':
      return <UnitBoughtChange {...commonProps} />;
    case 'sold':
      return <UnitSoldChange {...commonProps} />;
    case 'upgraded':
      return <UnitUpgradedChange {...commonProps} />;
    case 'benched':
      return <UnitBenchedChange {...commonProps} />;
    case 'deployed':
      return <UnitDeployedChange {...commonProps} />;
    case 'reposition':
      return <UnitRepositionChange {...commonProps} />;
    case 'organize_bench':
      return <UnitRepositionChange {...commonProps} />; // Reuse reposition component
    case 'item_added':
      return <ItemAddedChange {...commonProps} />;
    case 'item_assigned':
      return <ItemAssignedChange {...commonProps} />;
    case 'item_unassigned':
      return <ItemUnassignedChange {...commonProps} />;
    case 'item_reassigned':
      return <ItemReassignedChange {...commonProps} />;
    case 'synergy_added':
      return <SynergyAddedChange {...commonProps} />;
    case 'synergy_removed':
      return <SynergyRemovedChange {...commonProps} />;
    case 'synergy_level_changed':
      return <SynergyLevelChangedChange {...commonProps} />;
    case 'reroll':
      return <RerollChange {...commonProps} />;
    case 'xp_purchase':
      return <XpPurchaseChange {...commonProps} />;
    case 'level_up':
      return <LevelUpChange {...commonProps} />;
    case 'hp_change':
      return <HpChangeChange {...commonProps} />;
    default:
      return null;
  }
};

