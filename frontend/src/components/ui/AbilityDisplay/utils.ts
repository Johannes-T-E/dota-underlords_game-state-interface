/**
 * AbilityDisplay Utility Functions
 * 
 * Helper functions to process and format ability data for display
 */

export interface AbilityData {
  id: number;
  maxLevel?: number;
  cooldown?: number | number[];
  manaCost?: number;
  [key: string]: any;
}

export interface AbilitiesData {
  set_base: {
    [abilityName: string]: AbilityData;
  };
  [key: string]: any;
}

export interface AbilityDescriptions {
  lang: {
    Tokens: {
      [key: string]: string;
    };
  };
}

export interface AbilityDisplayData {
  abilityName: string;
  name: string;
  description: string;
  iconPath: string;
  data: AbilityData | null;
  cooldown?: number | number[];
  manaCost?: number;
}

/**
 * Get ability icon path
 * Handles 3-star abilities with generic icon
 */
export function getAbilityIconPath(abilityName: string): string {
  // 3star abilities use a generic icon
  if (abilityName.includes('3star')) {
    return '/icons/spellicons/3star_png.png';
  }
  return `/icons/spellicons/${abilityName}_png.png`;
}

/**
 * Get ability data from abilities.json
 * Prioritizes set_balance over set_base and other sets
 */
export function getAbilityData(
  abilityName: string,
  abilitiesData: AbilitiesData | null
): AbilityData | null {
  if (!abilitiesData) return null;
  
  // First, try set_balance (prioritized)
  if (abilitiesData.set_balance?.[abilityName]) {
    return abilitiesData.set_balance[abilityName];
  }
  
  // Then try set_base
  if (abilitiesData.set_base?.[abilityName]) {
    return abilitiesData.set_base[abilityName];
  }
  
  // Finally, try any other sets
  const allSets = Object.keys(abilitiesData);
  for (const setKey of allSets) {
    if (setKey !== 'set_balance' && setKey !== 'set_base') {
      if (abilitiesData[setKey]?.[abilityName]) {
        return abilitiesData[setKey][abilityName];
      }
    }
  }
  
  return null;
}

/**
 * Get ability name and description from dac_abilities_english.json
 */
export function getAbilityDescription(
  abilityName: string,
  abilityDescriptions: AbilityDescriptions | null
): { name: string; description: string } {
  if (!abilityDescriptions) {
    return {
      name: abilityName.replace(/_/g, ' '),
      description: '',
    };
  }
  
  const tokens = abilityDescriptions.lang?.Tokens || {};
  const abilityKey = `dac_ability_${abilityName}`;
  const name = tokens[abilityKey] || abilityName.replace(/_/g, ' ');
  // Try both _Description and _description (JSON has inconsistent casing)
  const description = tokens[`${abilityKey}_Description`] || tokens[`${abilityKey}_description`] || '';
  
  return { name, description };
}

/**
 * Format ability description by replacing placeholders with actual values
 */
export function formatAbilityDescription(description: string, abilityData: AbilityData | null): string {
  if (!description || !abilityData) return description;
  
  // Replace placeholders like {s:damage_absorb} with actual values
  let formatted = description;
  const matches = formatted.match(/\{s:(\w+)\}/g);
  
  if (matches) {
    matches.forEach(match => {
      const key = match.replace('{s:', '').replace('}', '');
      const value = abilityData[key];
      
      if (value !== undefined) {
        if (Array.isArray(value)) {
          // For arrays, show all values (e.g., [100, 300, 600] -> "100/300/600")
          formatted = formatted.replace(match, value.join('/'));
        } else {
          formatted = formatted.replace(match, String(value));
        }
      }
    });
  }
  
  // Replace <br> with line breaks
  formatted = formatted.replace(/<br>/gi, '\n');
  formatted = formatted.replace(/<br\/>/gi, '\n');
  
  return formatted;
}

/**
 * Format ability tooltip content
 * Returns formatted HTML/text for tooltip display
 */
export function formatAbilityTooltip(
  abilityData: AbilityData | null,
  name: string,
  description: string,
  iconPath?: string
): string {
  const parts: string[] = [];
  
  // Add header with icon and name
  parts.push(`<div class="ability-tooltip__header">`);
  if (iconPath) {
    parts.push(`<img src="${iconPath}" alt="${name}" class="ability-tooltip__icon" />`);
  }
  parts.push(`<strong>${name}</strong>`);
  parts.push(`</div>`);
  
  // Add cooldown if available
  if (abilityData?.cooldown !== undefined) {
    const cooldown = Array.isArray(abilityData.cooldown)
      ? abilityData.cooldown.join(' / ')
      : abilityData.cooldown;
    parts.push(`<div>Cooldown: ${cooldown} seconds</div>`);
  }
  
  // Add mana cost if available
  if (abilityData?.manaCost !== undefined) {
    parts.push(`<div>Mana Cost: ${abilityData.manaCost}</div>`);
  }
  
  // Add description if available
  if (description) {
    const formattedDesc = formatAbilityDescription(description, abilityData);
    parts.push(`<div>${formattedDesc.replace(/\n/g, '<br>')}</div>`);
  }
  
  return parts.join('');
}

/**
 * Process ability names into display data
 * Combines ability data and descriptions
 */
export function processAbilityForDisplay(
  abilityName: string,
  abilitiesData: AbilitiesData | null,
  abilityDescriptions: AbilityDescriptions | null
): AbilityDisplayData {
  const abilityData = getAbilityData(abilityName, abilitiesData);
  const { name, description } = getAbilityDescription(abilityName, abilityDescriptions);
  const formattedDescription = formatAbilityDescription(description, abilityData);
  
  return {
    abilityName,
    name,
    description: formattedDescription,
    iconPath: getAbilityIconPath(abilityName),
    data: abilityData,
    cooldown: abilityData?.cooldown,
    manaCost: abilityData?.manaCost,
  };
}

