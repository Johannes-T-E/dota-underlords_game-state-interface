import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ItemDisplay, getItemName } from '@/components/ui/ItemDisplay';
import { getTierColor } from '@/utils/tierColors';
import type { ItemData } from '@/utils/itemHelpers';
import type { ItemsLocalization } from '../../hooks/useItemsLocalization';
import './ItemCard.css';

export interface ItemCardProps {
  item: ItemData;
  itemsLocalization: ItemsLocalization | null;
  className?: string;
}

export const ItemCard = ({ item, itemsLocalization, className = '' }: ItemCardProps) => {
  const navigate = useNavigate();

  const tierColor = getTierColor(item.tier || 1);

  const itemName = useMemo(() => {
    return getItemName(item.id, item.displayName, itemsLocalization);
  }, [item.id, item.displayName, itemsLocalization]);

  const typeDisplay = useMemo(() => {
    if (!item.type) return '';
    return item.type
      .replace('equipment_', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }, [item.type]);

  const handleClick = () => {
    navigate(`/items/${item.id}`);
  };

  return (
    <div
      className={`item-card ${className}`}
      onClick={handleClick}
      style={{
        borderColor: tierColor,
      }}
    >
      <div className="item-card__name">
        {itemName}
      </div>
      <div className="item-card__icon">
        <ItemDisplay
          items={item}
          itemsLocalization={itemsLocalization}
          size="large"
        />
      </div>
      {item.tier && (
        <div className="item-card__tier">
          Tier {item.tier}
        </div>
      )}
      {typeDisplay && (
        <div className="item-card__type">
          {typeDisplay}
        </div>
      )}
    </div>
  );
};

