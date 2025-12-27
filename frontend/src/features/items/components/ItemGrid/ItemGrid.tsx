import { ItemCard } from '../ItemCard/ItemCard';
import type { ItemData } from '@/utils/itemHelpers';
import type { ItemsLocalization } from '../../hooks/useItemsLocalization';
import './ItemGrid.css';

export interface ItemGridProps {
  items: ItemData[];
  itemsLocalization: ItemsLocalization | null;
  className?: string;
}

export const ItemGrid = ({ items, itemsLocalization, className = '' }: ItemGridProps) => {
  return (
    <div className={`item-grid ${className}`}>
      {items.map(item => (
        <ItemCard
          key={item.id}
          item={item}
          itemsLocalization={itemsLocalization}
        />
      ))}
    </div>
  );
};

