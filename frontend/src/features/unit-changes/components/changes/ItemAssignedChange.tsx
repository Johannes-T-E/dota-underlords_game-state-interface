import React from 'react';
import { Text as UIText, HeroPortrait } from '@/components/ui';
import { BaseChange } from './BaseChange';
import { useItemsData } from '@/hooks/useItemsData';
import { findItemByItemId, getItemIconPath } from '@/utils/itemHelpers';
import type { Change } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';

export interface ItemAssignedChangeProps {
  change: Change;
  playerName: string;
  timeDisplay: string;
  heroesData: HeroesData | null;
  player?: any;
}

export const ItemAssignedChange: React.FC<ItemAssignedChangeProps> = ({
  change,
  playerName,
  timeDisplay,
  heroesData,
  player
}) => {
  const { itemsData } = useItemsData();
  
  const item = change.item_id ? findItemByItemId(itemsData, change.item_id) : null;
  const itemIconPath = item?.icon ? getItemIconPath(item.icon) : null;

  // Try to find the unit that received the item
  const assignedUnit = player?.units?.find(
    (u: any) => u.entindex === change.assigned_unit_entindex
  );

  const icon = itemIconPath ? (
    <div className="unit-changes-widget__item-icon">
      <img 
        src={itemIconPath} 
        alt={item?.icon || 'Item'} 
        className="unit-changes-widget__item-image"
      />
    </div>
  ) : (
    <div className="unit-changes-widget__item-icon">
      <span className="unit-changes-widget__icon">📦</span>
    </div>
  );

  const getItemDisplayName = () => {
    if (!item) return `Item ${change.item_id}`;
    if (item.displayName && !item.displayName.startsWith('#')) {
      return item.displayName;
    }
    if (item.icon) {
      return item.icon.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return `Item ${change.item_id}`;
  };

  const content = (
    <div className="unit-changes-widget__item-change-info">
      {change.item_id && (
        <UIText variant="label" className="unit-changes-widget__item-name">
          {getItemDisplayName()}
        </UIText>
      )}
      {change.assigned_unit_entindex !== null && change.assigned_unit_entindex !== undefined && (
        <div className="unit-changes-widget__item-assignment">
          <span className="unit-changes-widget__assignment-arrow">→</span>
          {assignedUnit && heroesData ? (
            <HeroPortrait
              unitId={assignedUnit.unit_id}
              rank={assignedUnit.rank || 0}
              heroesData={heroesData}
              className="unit-changes-widget__assignment-portrait"
            />
          ) : (
            <UIText variant="label" className="unit-changes-widget__assignment-text">
              Unit {change.assigned_unit_entindex}
            </UIText>
          )}
        </div>
      )}
    </div>
  );

  return (
    <BaseChange
      change={change}
      playerName={playerName}
      timeDisplay={timeDisplay}
      heroesData={heroesData}
      icon={icon}
      content={content}
    />
  );
};

