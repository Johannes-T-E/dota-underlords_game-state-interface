// Hero data structure types
export interface HeroData {
  // Core identification
  id: number;
  dota_unit_name: string;
  displayName: string;
  texturename: string;
  
  // Stats that scale with star level (arrays)
  damageMin: number[];
  damageMax: number[];
  health: number[];
  armor: number | number[];
  magicResist: number | number[];
  
  // Combat stats
  attackAnimationPoint: number;
  attackRange: number;
  attackRate: number;
  movespeed: number;
  maxmana: number;
  
  // Game mechanics
  draftTier: number;
  goldCost: number;
  keywords: number[];
  
  // Abilities and hints
  abilities: string[];
  extra_abilities?: string[];
  hintWords: string[];
  
  // Visual and audio
  model: string;
  model_scale: number;
  soundSet: string;
  healthBarOffset: number;
  
  // Optional fields that some heroes have
  projectile_speed?: number;
  projectile_model?: string;
  baseclass?: string | null;
  assassin_modifier?: string | null;
  aiAura?: boolean;
  aiPassiveAbility?: boolean;
  prevent_mana_items?: number;
  precache?: string[];
  content_enable_group?: string | null;
}

export interface HeroesData {
  heroes: {
    [heroName: string]: HeroData;
  };
}

// Helper function to get hero icon path from unit ID
export const getHeroIconPath = (unitId: number, heroesData: HeroesData | null): string => {
  if (!heroesData || !heroesData.heroes) {
    return '/icons/hero_icons_scaled_56x56/npc_dota_hero_abaddon_png.png';
  }
  
  // Check if this is a contraption unit
  const contraptionIds = [117, 143, 127];
  if (contraptionIds.includes(unitId)) {
    // Map contraption IDs to their image files
    const contraptionImageMap: { [key: number]: string } = {
      117: 'build_target_dummy_psd.png',
      143: 'build_barricade_psd.png',
      127: 'build_mango_tree_psd.png'
    };
    return `/icons/items/${contraptionImageMap[unitId]}`;
  }
  
  // Find hero by ID and return dota_unit_name
  for (const [, heroData] of Object.entries(heroesData.heroes)) {
    if (heroData.id === unitId) {
      return `/icons/hero_icons_scaled_56x56/${heroData.dota_unit_name}_png.png`;
    }
  }
  
  return '/icons/hero_icons_scaled_56x56/npc_dota_hero_abaddon_png.png'; // fallback
};

// Helper function to get star icon path
export const getStarIconPath = (rank: number): string => {
  const starRank = Math.min(rank, 3);
  return `/icons/UI_icons/star_icons/star_rank${starRank}_psd.png`;
};

// Helper function to get hero tier from unit ID
export const getHeroTier = (unitId: number, heroesData: HeroesData | null): number => {
  if (!heroesData || !heroesData.heroes) {
    return 1; // Default tier if no data available
  }
  
  // Find hero by ID and return draftTier
  for (const [, heroData] of Object.entries(heroesData.heroes)) {
    if (heroData.id === unitId) {
      return heroData.draftTier;
    }
  }
  
  return 1; // Default tier if hero not found
};

// Helper function to get tier glow CSS class
export const getTierGlowClass = (tier: number): string => {
  const tierNumber = Math.min(Math.max(tier, 1), 5); // Clamp between 1-5
  return `hero-image--tier-${tierNumber}`;
};