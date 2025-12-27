import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ItemDisplay, getItemName } from '@/components/ui/ItemDisplay';
import { EmptyState } from '@/components/shared';
import type { ItemData } from '@/utils/itemHelpers';
import type { ItemsLocalization } from '../../hooks/useItemsLocalization';
import './ItemTable.css';

export interface ItemTableProps {
  items: ItemData[];
  itemsLocalization: ItemsLocalization | null;
  className?: string;
}

type SortColumn = 'name' | 'tier' | 'type' | 'damage' | 'armor' | 'health' | 'attackSpeed' | 'manaRegen';
type SortDirection = 'asc' | 'desc';

export const ItemTable = ({ items, itemsLocalization, className = '' }: ItemTableProps) => {
  const navigate = useNavigate();
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    
    sorted.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortColumn) {
        case 'name':
          aValue = getItemName(a.id, a.displayName, itemsLocalization);
          bValue = getItemName(b.id, b.displayName, itemsLocalization);
          break;
        case 'tier':
          aValue = a.tier ?? 0;
          bValue = b.tier ?? 0;
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'damage': {
          const aDamage = Array.isArray(a.attack_damage) ? a.attack_damage[0] : (a.attack_damage || 0);
          const bDamage = Array.isArray(b.attack_damage) ? b.attack_damage[0] : (b.attack_damage || 0);
          aValue = aDamage;
          bValue = bDamage;
          break;
        }
        case 'armor': {
          const aArmor = Array.isArray(a.bonus_armor) ? a.bonus_armor[0] : (a.bonus_armor || 0);
          const bArmor = Array.isArray(b.bonus_armor) ? b.bonus_armor[0] : (b.bonus_armor || 0);
          aValue = aArmor;
          bValue = bArmor;
          break;
        }
        case 'health': {
          const aHealth = Array.isArray(a.health_bonus) ? a.health_bonus[0] : (a.health_bonus || 0);
          const bHealth = Array.isArray(b.health_bonus) ? b.health_bonus[0] : (b.health_bonus || 0);
          aValue = aHealth;
          bValue = bHealth;
          break;
        }
        case 'attackSpeed': {
          const aSpeed = Array.isArray(a.attack_speed) ? a.attack_speed[0] : (a.attack_speed || 0);
          const bSpeed = Array.isArray(b.attack_speed) ? b.attack_speed[0] : (b.attack_speed || 0);
          aValue = aSpeed;
          bValue = bSpeed;
          break;
        }
        case 'manaRegen': {
          const aRegen = Array.isArray(a.mana_per_second) ? a.mana_per_second[0] : (a.mana_per_second || 0);
          const bRegen = Array.isArray(b.mana_per_second) ? b.mana_per_second[0] : (b.mana_per_second || 0);
          aValue = aRegen;
          bValue = bRegen;
          break;
        }
        default:
          aValue = 0;
          bValue = 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [items, sortColumn, sortDirection, itemsLocalization]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const handleRowClick = (itemId: number) => {
    navigate(`/items/${itemId}`);
  };

  if (items.length === 0) {
    return (
      <div className={`item-table item-table--empty ${className}`}>
        <EmptyState
          title="No Items Found"
          message="Try adjusting your filters to see more items."
        />
      </div>
    );
  }

  return (
    <div className={`item-table ${className}`}>
      <table className="item-table__table">
        <thead>
          <tr>
            <th 
              className="item-table__header item-table__header--sortable"
              onClick={() => handleSort('name')}
            >
              Name{getSortIndicator('name')}
            </th>
            <th 
              className="item-table__header item-table__header--sortable"
              onClick={() => handleSort('tier')}
            >
              Tier{getSortIndicator('tier')}
            </th>
            <th 
              className="item-table__header item-table__header--sortable"
              onClick={() => handleSort('type')}
            >
              Type{getSortIndicator('type')}
            </th>
            <th 
              className="item-table__header item-table__header--sortable"
              onClick={() => handleSort('damage')}
            >
              Damage{getSortIndicator('damage')}
            </th>
            <th 
              className="item-table__header item-table__header--sortable"
              onClick={() => handleSort('armor')}
            >
              Armor{getSortIndicator('armor')}
            </th>
            <th 
              className="item-table__header item-table__header--sortable"
              onClick={() => handleSort('health')}
            >
              Health{getSortIndicator('health')}
            </th>
            <th 
              className="item-table__header item-table__header--sortable"
              onClick={() => handleSort('attackSpeed')}
            >
              Attack Speed{getSortIndicator('attackSpeed')}
            </th>
            <th 
              className="item-table__header item-table__header--sortable"
              onClick={() => handleSort('manaRegen')}
            >
              Mana Regen{getSortIndicator('manaRegen')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map(item => {
            const itemName = getItemName(item.id, item.displayName, itemsLocalization);
            const typeDisplay = item.type
              ? item.type.replace('equipment_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              : '';
            
            const damage = Array.isArray(item.attack_damage) ? item.attack_damage[0] : (item.attack_damage || '-');
            const armor = Array.isArray(item.bonus_armor) ? item.bonus_armor[0] : (item.bonus_armor || '-');
            const health = Array.isArray(item.health_bonus) ? item.health_bonus[0] : (item.health_bonus || '-');
            const attackSpeed = Array.isArray(item.attack_speed) ? item.attack_speed[0] : (item.attack_speed || '-');
            const manaRegen = Array.isArray(item.mana_per_second) ? item.mana_per_second[0] : (item.mana_per_second || '-');

            return (
              <tr
                key={item.id}
                className="item-table__row"
                onClick={() => handleRowClick(item.id)}
              >
                <td className="item-table__cell item-table__cell--name">
                  <div className="item-table__name-wrapper">
                    <div className="item-table__icon">
                      <ItemDisplay
                        items={item}
                        itemsLocalization={itemsLocalization}
                        size="medium"
                      />
                    </div>
                    <span className="item-table__name">{itemName}</span>
                  </div>
                </td>
                <td className="item-table__cell">{item.tier ?? '-'}</td>
                <td className="item-table__cell">{typeDisplay}</td>
                <td className="item-table__cell">{damage}</td>
                <td className="item-table__cell">{armor}</td>
                <td className="item-table__cell">{health}</td>
                <td className="item-table__cell">{attackSpeed}</td>
                <td className="item-table__cell">{manaRegen}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

