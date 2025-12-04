import React from 'react';
import { Text as UIText } from '@/components/ui';
import { BaseChange } from './BaseChange';
import { useItemsData } from '@/hooks/useItemsData';
import { findItemByItemId, getItemIconPath } from '@/utils/itemHelpers';
import type { Change } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';

export interface ItemAddedChangeProps {
  change: Change;
  playerName: string;
  timeDisplay: string;
  heroesData: HeroesData | null;
  player?: any;
}

export const ItemAddedChange: React.FC<ItemAddedChangeProps> = ({
  change,
  playerName,
  timeDisplay,
  heroesData
}) => {
  const { itemsData } = useItemsData();
  
  const item = change.item_id ? findItemByItemId(itemsData, change.item_id) : null;
  const itemIconPath = item?.icon ? getItemIconPath(item.icon) : null;

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
    // Format icon name (e.g., "claymore" -> "Claymore")
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
        <>
          <UIText variant="label" className="unit-changes-widget__item-name">
            {getItemDisplayName()}
          </UIText>
          {item?.tier && (
            <UIText variant="label" className="unit-changes-widget__item-tier">
              Tier {item.tier}
            </UIText>
          )}
        </>
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

