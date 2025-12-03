import { useState, useEffect } from 'react';
import type { ItemsData } from '@/utils/itemHelpers';

// Module-level cache to avoid re-parsing JSON and creating duplicate objects
let cachedItemsData: ItemsData | null = null;
let pendingItemsPromise: Promise<ItemsData> | null = null;

export const useItemsData = () => {
  const [itemsData, setItemsData] = useState<ItemsData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadItemsData = async () => {
      try {
        // Use module-level cache if available
        if (cachedItemsData) {
          if (!cancelled) {
            setItemsData(cachedItemsData);
            setLoaded(true);
          }
          return;
        }

        // Check localStorage first
        const cached = localStorage.getItem('itemsData');
        if (cached) {
          try {
            const data = JSON.parse(cached);
            cachedItemsData = data; // Store in module cache
            if (!cancelled) {
              setItemsData(data);
              setLoaded(true);
            }
            return;
          } catch (err) {
            console.error('Failed to parse cached items data:', err);
          }
        }

        // If not in cache, fetch from server
        if (!pendingItemsPromise) {
          pendingItemsPromise = fetch('/items.json')
            .then(res => res.json())
            .then((data: ItemsData) => {
              // Store in localStorage and module cache
              localStorage.setItem('itemsData', JSON.stringify(data));
              cachedItemsData = data;
              return data;
            })
            .finally(() => {
              pendingItemsPromise = null;
            });
        }

        const data = await pendingItemsPromise;
        if (!cancelled) {
          setItemsData(data);
          setLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load items data:', err);
        if (!cancelled) {
          setLoaded(true);
        }
      }
    };

    loadItemsData();

    return () => {
      cancelled = true;
    };
  }, []);

  return { itemsData, loaded };
};
