import type { ItemSlot } from '@/types';

export interface ItemData {
  id: number;
  icon: string;
  [key: string]: any;
}

export interface ItemsData {
  set_base?: Record<string, ItemData>;
  set_balance?: Record<string, ItemData>;
  [key: string]: any;
}

/**
 * Find an item by its ID in items.json data
 * Searches through set_base and set_balance sections
 */
export function findItemByItemId(itemsData: ItemsData | null, itemId: number): ItemData | null {
  if (!itemsData) return null;

  // Search in set_base first
  if (itemsData.set_base) {
    for (const item of Object.values(itemsData.set_base)) {
      if (item.id === itemId) {
        return item;
      }
    }
  }

  // Search in set_balance if not found
  if (itemsData.set_balance) {
    for (const item of Object.values(itemsData.set_balance)) {
      if (item.id === itemId) {
        return item;
      }
    }
  }

  return null;
}

/**
 * Get the icon path for an item icon name
 */
export function getItemIconPath(iconName: string): string {
  return `/icons/items/small/${iconName}_psd.png`;
}

/**
 * Find the equipped item for a unit and return its icon path
 */
export function findEquippedItem(
  unitEntindex: number | undefined,
  itemSlots: ItemSlot[] | undefined,
  itemsData: ItemsData | null
): string | null {
  if (unitEntindex === undefined || !itemSlots || !itemsData) {
    return null;
  }

  // Find item slot assigned to this unit
  const itemSlot = itemSlots.find(
    slot => slot.assigned_unit_entindex === unitEntindex
  );

  if (!itemSlot) {
    return null;
  }

  // Find item data by item_id
  const item = findItemByItemId(itemsData, itemSlot.item_id);
  if (!item || !item.icon) {
    return null;
  }

  // Return icon path
  return getItemIconPath(item.icon);
}

