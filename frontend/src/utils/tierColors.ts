// Tier color mapping for Underlords heroes
export const TIER_COLORS = {
  1: '#c8c8c8', // Gray (secondary color for tier 1)
  2: '#65f013', // Green (secondary color for tier 2)
  3: '#14b4eb', // Blue (secondary color for tier 3)
  4: '#c151ec', // Purple (secondary color for tier 4)
  5: '#f8ad33'  // Gold (secondary color for tier 5)
} as const;

/**
 * Get the tier color for a given tier level
 * @param tier The tier level (1-5)
 * @returns The hex color string for that tier
 */
export const getTierColor = (tier: number): string => {
  return TIER_COLORS[tier as keyof typeof TIER_COLORS] || '#ffffff';
};
