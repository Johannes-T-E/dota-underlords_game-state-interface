import type { ItemData, ItemsData } from '@/utils/itemHelpers';
import type { ItemsLocalization } from '@/features/items/hooks/useItemsLocalization';
export type { ItemData } from '@/utils/itemHelpers';
export type { ItemsLocalization } from '@/features/items/hooks/useItemsLocalization';

export interface ItemDisplayData {
  itemData: ItemData;
  name: string;
  description: string;
  iconPath: string;
}

/**
 * Get item icon path
 */
export function getItemIconPath(iconName: string): string {
  return `/icons/items/small/${iconName}_psd.png`;
}

/**
 * Get localized item name
 * Handles both DAC_Item_{itemId} format and #dac_item_* format
 */
export function getItemName(
  itemId: number,
  displayName: string | undefined,
  itemsLocalization: ItemsLocalization | null
): string {
  if (!itemsLocalization) {
    // Fallback: format displayName or use itemId
    if (displayName && !displayName.startsWith('#')) {
      return displayName;
    }
    return `Item ${itemId}`;
  }

  const tokens = itemsLocalization.lang?.Tokens || {};

  // Try DAC_Item_{itemId} format first
  const itemKey = `DAC_Item_${itemId}`;
  if (tokens[itemKey]) {
    return tokens[itemKey];
  }

  // Try displayName as localization key (e.g., #dac_item_claymore)
  if (displayName && displayName.startsWith('#')) {
    const key = displayName.substring(1).replace(/#/g, '_');
    const upperKey = key.toUpperCase();
    if (tokens[upperKey]) {
      return tokens[upperKey];
    }
    // Try with DAC_ prefix
    if (tokens[`DAC_${upperKey}`]) {
      return tokens[`DAC_${upperKey}`]!;
    }
  }

  // Fallback: format displayName or use itemId
  if (displayName && !displayName.startsWith('#')) {
    return displayName;
  }

  return `Item ${itemId}`;
}

/**
 * Get localized item description
 */
export function getItemDescription(
  itemId: number,
  description: string | undefined,
  itemsLocalization: ItemsLocalization | null
): string {
  if (!itemsLocalization) {
    return description || '';
  }

  const tokens = itemsLocalization.lang?.Tokens || {};

  // Try DAC_Item_{itemId}_desc or DAC_Item_{itemId}_Desc format
  const descKey = `DAC_Item_${itemId}_desc`;
  const descKeyAlt = `DAC_Item_${itemId}_Desc`;
  if (tokens[descKey]) {
    return tokens[descKey];
  }
  if (tokens[descKeyAlt]) {
    return tokens[descKeyAlt];
  }

  // Try description as localization key
  if (description && description.startsWith('#')) {
    const key = description.substring(1).replace(/#/g, '_');
    const upperKey = key.toUpperCase();
    if (tokens[upperKey]) {
      return tokens[upperKey];
    }
    // Try with DAC_ prefix and _desc suffix
    if (tokens[`DAC_${upperKey}_desc`]) {
      return tokens[`DAC_${upperKey}_desc`]!;
    }
    if (tokens[`DAC_${upperKey}_Desc`]) {
      return tokens[`DAC_${upperKey}_Desc`]!;
    }
  }

  return description || '';
}

/**
 * Format item tooltip content
 * Returns formatted HTML/text for tooltip display
 */
export function formatItemTooltip(
  itemData: ItemData,
  name: string,
  description: string
): string {
  const parts: string[] = [];

  // Add header with icon and name
  const iconPath = getItemIconPath(itemData.icon);
  parts.push(`<div class="item-tooltip__header">`);
  parts.push(`<img src="${iconPath}" alt="${name}" class="item-tooltip__icon" />`);
  parts.push(`<strong>${name}</strong>`);
  parts.push(`</div>`);

  // Add tier if available
  if (itemData.tier !== undefined) {
    parts.push(`<div>Tier: ${itemData.tier}</div>`);
  }

  // Add type if available
  if (itemData.type) {
    const typeDisplay = itemData.type
      .replace('equipment_', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
    parts.push(`<div>Type: ${typeDisplay}</div>`);
  }

  // Add key stats
  if (itemData.attack_damage) {
    const damage = Array.isArray(itemData.attack_damage)
      ? itemData.attack_damage.join(' / ')
      : itemData.attack_damage;
    parts.push(`<div>Attack Damage: ${damage}</div>`);
  }

  if (itemData.bonus_armor) {
    const armor = Array.isArray(itemData.bonus_armor)
      ? itemData.bonus_armor.join(' / ')
      : itemData.bonus_armor;
    parts.push(`<div>Armor: ${armor}</div>`);
  }

  if (itemData.health_bonus) {
    const health = Array.isArray(itemData.health_bonus)
      ? itemData.health_bonus.join(' / ')
      : itemData.health_bonus;
    parts.push(`<div>Health: ${health}</div>`);
  }

  if (itemData.attack_speed) {
    const attackSpeed = Array.isArray(itemData.attack_speed)
      ? itemData.attack_speed.join(' / ')
      : itemData.attack_speed;
    parts.push(`<div>Attack Speed: ${attackSpeed}</div>`);
  }

  if (itemData.mana_per_second) {
    const manaRegen = Array.isArray(itemData.mana_per_second)
      ? itemData.mana_per_second.join(' / ')
      : itemData.mana_per_second;
    parts.push(`<div>Mana Regen: ${manaRegen}</div>`);
  }

  // Add description if available
  if (description) {
    parts.push(`<div>${description.replace(/\n/g, '<br>')}</div>`);
  }

  return parts.join('');
}

/**
 * Process item data for display
 * Combines item data and localization
 */
export function processItemForDisplay(
  itemData: ItemData,
  itemsLocalization: ItemsLocalization | null
): ItemDisplayData {
  const name = getItemName(itemData.id, itemData.displayName, itemsLocalization);
  const description = getItemDescription(itemData.id, itemData.description, itemsLocalization);

  return {
    itemData,
    name,
    description,
    iconPath: getItemIconPath(itemData.icon),
  };
}

/**
 * Get all items from items data, prioritizing set_balance over set_base
 * Deduplicates by ID (prefers set_balance version)
 */
export function getAllItems(itemsData: ItemsData | null): ItemData[] {
  if (!itemsData) return [];

  const itemsMap = new Map<number, ItemData>();

  // First, add items from set_base
  if (itemsData.set_base) {
    for (const item of Object.values(itemsData.set_base)) {
      if (item.id && !itemsMap.has(item.id)) {
        itemsMap.set(item.id, item);
      }
    }
  }

  // Then, add/override with items from set_balance (prioritized)
  if (itemsData.set_balance) {
    for (const item of Object.values(itemsData.set_balance)) {
      if (item.id) {
        itemsMap.set(item.id, item);
      }
    }
  }

  return Array.from(itemsMap.values());
}

