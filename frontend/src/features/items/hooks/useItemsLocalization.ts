import { useState, useEffect } from 'react';

export interface ItemsLocalization {
  lang: {
    Language: string;
    Tokens: {
      [key: string]: string;
    };
  };
}

// Module-level cache
let cachedItemsLocalization: ItemsLocalization | null = null;
let pendingLocalizationPromise: Promise<ItemsLocalization> | null = null;

export const useItemsLocalization = () => {
  const [itemsLocalization, setItemsLocalization] = useState<ItemsLocalization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load items_english.json
        if (!cachedItemsLocalization && !pendingLocalizationPromise) {
          pendingLocalizationPromise = fetch('/localization/items_english.json')
            .then(res => res.json())
            .then((data: ItemsLocalization) => {
              cachedItemsLocalization = data;
              return data;
            })
            .finally(() => {
              pendingLocalizationPromise = null;
            });
        }

        const localization = await (cachedItemsLocalization || pendingLocalizationPromise);

        if (!cancelled) {
          setItemsLocalization(localization || null);
        }
      } catch (err) {
        console.error('Failed to load items localization data:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  return { itemsLocalization, loading };
};

