// Hero data structure types
export interface HeroData {
  id: number;
  dota_unit_name: string;
  name?: string;
  cost?: number;
  keywords?: string[];
  draftTier?: number;
}

export interface HeroesData {
  heroes: {
    [heroName: string]: HeroData;
  };
}

// Helper function to get hero icon path from unit ID
export const getHeroIconPath = (
  unitId: number,
  heroesData: HeroesData | null
): string => {
  if (!heroesData || !heroesData.heroes) {
    return "/icons/hero_icons_scaled_56x56/npc_dota_hero_abaddon_png.png";
  }

  // Find hero by ID and return dota_unit_name
  for (const [, heroData] of Object.entries(heroesData.heroes)) {
    if (heroData.id === unitId) {
      return `/icons/hero_icons_scaled_56x56/${heroData.dota_unit_name}_png.png`;
    }
  }

  return "/icons/hero_icons_scaled_56x56/npc_dota_hero_abaddon_png.png"; // fallback
};

// Helper function to get star icon path
export const getStarIconPath = (rank: number): string => {
  const starRank = Math.min(rank, 3);
  return `/icons/UI_icons/star_icons/star_rank${starRank}_psd.png`;
};

// Helper function to create star icons HTML
export const createStarIcons = (starLevel: number): string => {
  let stars = "";
  for (let i = 0; i < starLevel; i++) {
    stars += `<div class="star-icon rank${Math.min(starLevel, 3)}"></div>`;
  }
  return stars;
};

// Helper function to get hero draft tier from unit ID
export const getHeroDraftTier = (
  unitId: number,
  heroesData: HeroesData | null
): number => {
  if (!heroesData || !heroesData.heroes) {
    return 1; // default to tier 1
  }

  // Find hero by ID and return draftTier
  for (const [, heroData] of Object.entries(heroesData.heroes)) {
    if (heroData.id === unitId) {
      return heroData.draftTier || 1;
    }
  }

  return 1; // fallback to tier 1
};

// Helper function to check if unit is an underlord
export const isUnderlord = (unitId: number): boolean => {
  // Underlords have IDs: 1001 (annexis), 1002 (jull), 1003 (enno), 1004 (hobgen)
  return unitId >= 1001 && unitId <= 1004;
};

// Helper function to get tier glow color CSS variable
export const getTierGlowColor = (tier: number): string => {
  switch (tier) {
    case 1:
      return "var(--tier1-glow-color)";
    case 2:
      return "var(--tier2-glow-color)";
    case 3:
      return "var(--tier3-glow-color)";
    case 4:
      return "var(--tier4-glow-color)";
    case 5:
      return "var(--tier5-glow-color)";
    default:
      return "var(--tier1-glow-color)";
  }
};

// Helper function to get hero glow color (checks for underlords first)
export const getHeroGlowColor = (
  unitId: number,
  heroesData: HeroesData | null
): string => {
  // Check if unit is an underlord first
  if (isUnderlord(unitId)) {
    return "var(--underlord-glow-color)";
  }

  // Otherwise use tier-based color
  const draftTier = getHeroDraftTier(unitId, heroesData);
  return getTierGlowColor(draftTier);
};
