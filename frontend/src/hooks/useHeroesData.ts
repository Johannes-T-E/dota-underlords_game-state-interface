import { useState, useEffect } from 'react';
import type { HeroesData } from '@/utils/heroHelpers';

// Module-level cache to avoid re-fetching large JSON
let cachedHeroesData: HeroesData | null = null;
let pendingHeroesPromise: Promise<HeroesData> | null = null;

export const useHeroesData = () => {
  const [heroesData, setHeroesData] = useState<HeroesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadHeroesData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (cachedHeroesData) {
          if (!cancelled) setHeroesData(cachedHeroesData);
          return;
        }

        if (!pendingHeroesPromise) {
          pendingHeroesPromise = fetch('/underlords_heroes.json')
            .then((response) => {
              if (!response.ok) {
                throw new Error(`Failed to load heroes data: ${response.status}`);
              }
              return response.json();
            })
            .then((data: HeroesData) => {
              cachedHeroesData = data;
              return data;
            })
            .finally(() => {
              pendingHeroesPromise = null;
            });
        }

        const data = await pendingHeroesPromise;
        if (!cancelled) {
          setHeroesData(data);
          console.log('[useHeroesData] Heroes data loaded successfully');
        }
      } catch (err) {
        console.error('[useHeroesData] Failed to load heroes data:', err);
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load heroes data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadHeroesData();

    return () => {
      cancelled = true;
    };
  }, []);

  return { heroesData, loading, error };
};
