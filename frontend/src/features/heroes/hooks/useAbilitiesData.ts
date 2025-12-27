import { useState, useEffect } from 'react';

interface AbilityData {
  id: number;
  maxLevel?: number;
  cooldown?: number | number[];
  manaCost?: number;
  [key: string]: any;
}

interface AbilitiesData {
  set_base: {
    [abilityName: string]: AbilityData;
  };
  [key: string]: any;
}

interface AbilityDescriptions {
  lang: {
    Tokens: {
      [key: string]: string;
    };
  };
}

// Module-level cache
let cachedAbilitiesData: AbilitiesData | null = null;
let cachedAbilityDescriptions: AbilityDescriptions | null = null;
let pendingAbilitiesPromise: Promise<AbilitiesData> | null = null;
let pendingDescriptionsPromise: Promise<AbilityDescriptions> | null = null;

export const useAbilitiesData = () => {
  const [abilitiesData, setAbilitiesData] = useState<AbilitiesData | null>(null);
  const [abilityDescriptions, setAbilityDescriptions] = useState<AbilityDescriptions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load abilities.json
        if (!cachedAbilitiesData && !pendingAbilitiesPromise) {
          pendingAbilitiesPromise = fetch('/localization/abilities.json')
            .then(res => {
              if (!res.ok) {
                // Fallback to root if not in localization folder
                return fetch('/abilities.json');
              }
              return res;
            })
            .then(res => res.json())
            .then((data: AbilitiesData) => {
              cachedAbilitiesData = data;
              return data;
            })
            .finally(() => {
              pendingAbilitiesPromise = null;
            });
        }

        // Load dac_abilities_english.json
        if (!cachedAbilityDescriptions && !pendingDescriptionsPromise) {
          pendingDescriptionsPromise = fetch('/localization/dac_abilities_english.json')
            .then(res => res.json())
            .then((data: AbilityDescriptions) => {
              cachedAbilityDescriptions = data;
              return data;
            })
            .finally(() => {
              pendingDescriptionsPromise = null;
            });
        }

        const [abilities, descriptions] = await Promise.all([
          cachedAbilitiesData || pendingAbilitiesPromise,
          cachedAbilityDescriptions || pendingDescriptionsPromise,
        ]);

        if (!cancelled) {
          setAbilitiesData(abilities || null);
          setAbilityDescriptions(descriptions || null);
        }
      } catch (err) {
        console.error('Failed to load abilities data:', err);
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

  return { abilitiesData, abilityDescriptions, loading };
};

