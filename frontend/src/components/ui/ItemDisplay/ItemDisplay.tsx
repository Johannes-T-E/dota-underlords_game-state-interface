import React, { useMemo, memo } from 'react';
import { ItemIcon } from './components';
import { processItemForDisplay, type ItemData, type ItemsLocalization } from './utils';
import './ItemDisplay.css';

export interface ItemDisplayProps {
  items: ItemData | ItemData[];
  itemsLocalization: ItemsLocalization | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * ItemDisplay - Displays item icon(s) with hover tooltips
 * 
 * Features:
 * - Displays single item or multiple items
 * - Each item shows icon with hover tooltip
 * - Memoized for performance
 * - Handles missing items gracefully
 */
const ItemDisplay: React.FC<ItemDisplayProps> = memo(({
  items,
  itemsLocalization,
  size = 'medium',
  className = '',
}) => {
  // Process items into display data
  const processedItems = useMemo(() => {
    const itemsArray = Array.isArray(items) ? items : [items];
    
    if (itemsArray.length === 0) return [];
    
    return itemsArray.map(item =>
      processItemForDisplay(item, itemsLocalization)
    );
  }, [items, itemsLocalization]);

  if (processedItems.length === 0) {
    return null;
  }

  return (
    <div className={`item-display item-display--${size} ${className}`}>
      {processedItems.map((item, index) => (
        <ItemIcon
          key={`${item.itemData.id}-${index}`}
          itemData={item}
          size={size}
        />
      ))}
    </div>
  );
});

ItemDisplay.displayName = 'ItemDisplay';

export default ItemDisplay;

