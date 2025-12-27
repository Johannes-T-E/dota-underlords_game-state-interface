import React, { memo, useState } from 'react';
import { Tooltip } from '../../../AbilityDisplay/Tooltip';
import { formatItemTooltip, type ItemDisplayData } from '../../utils';
import './ItemIcon.css';

export interface ItemIconProps {
  itemData: ItemDisplayData;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * ItemIcon - Displays an item icon with hover tooltip
 * 
 * Features:
 * - Memoized for performance
 * - Handles missing icons gracefully
 * - Shows tooltip on hover with full item information
 */
const ItemIcon: React.FC<ItemIconProps> = memo(({
  itemData,
  size = 'medium',
  className = '',
}) => {
  const [iconError, setIconError] = useState(false);
  
  const tooltipContent = formatItemTooltip(
    itemData.itemData,
    itemData.name,
    itemData.description
  );

  return (
    <Tooltip content={tooltipContent} position="top" className={className}>
      <div className={`item-icon item-icon--${size}`}>
        {!iconError && (
          <img
            src={itemData.iconPath}
            alt={itemData.name}
            className="item-icon__image"
            onError={() => setIconError(true)}
          />
        )}
        {iconError && (
          <div className="item-icon__placeholder">
            {itemData.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </Tooltip>
  );
});

ItemIcon.displayName = 'ItemIcon';

export { ItemIcon };
export default ItemIcon;

