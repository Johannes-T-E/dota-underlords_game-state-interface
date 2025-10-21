import { useState, useEffect } from 'react';
import type { HeroesData } from '../utils/heroHelpers';

export const useHeroesData = () => {
  const [heroesData, setHeroesData] = useState<HeroesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHeroesData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/underlords_heroes.json');
        if (!response.ok) {
          throw new Error(`Failed to load heroes data: ${response.status}`);
        }
        
        const data = await response.json();
        setHeroesData(data);
        console.log('[useHeroesData] Heroes data loaded successfully');
      } catch (err) {
        console.error('[useHeroesData] Failed to load heroes data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load heroes data');
      } finally {
        setLoading(false);
      }
    };

    loadHeroesData();
  }, []);

  return { heroesData, loading, error };
};
