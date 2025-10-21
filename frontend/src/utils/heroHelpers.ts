// Hero data structure types
export interface HeroData {
  id: number;
  dota_unit_name: string;
  name?: string;
  cost?: number;
  keywords?: string[];
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

// Helper function to create star icons HTML
export const createStarIcons = (starLevel: number): string => {
  let stars = '';
  for (let i = 0; i < starLevel; i++) {
    stars += `<div class="star-icon rank${Math.min(starLevel, 3)}"></div>`;
  }
  return stars;
};
