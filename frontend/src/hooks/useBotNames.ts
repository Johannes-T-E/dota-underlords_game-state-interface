import { useState, useEffect } from 'react';

export const useBotNames = () => {
  const [botNames, setBotNames] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Check localStorage first
    const cached = localStorage.getItem('botNames');
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (!cancelled) {
          setBotNames(data);
          setLoaded(true);
        }
        return;
      } catch (err) {
        console.error('Failed to parse cached bot names:', err);
      }
    }

    // If not in cache, fetch from server
    fetch('/dac_botnames.json')
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          // Store in localStorage for future use
          localStorage.setItem('botNames', JSON.stringify(data));
          setBotNames(data);
          setLoaded(true);
        }
      })
      .catch(err => {
        console.error('Failed to load bot names:', err);
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const getBotName = (botPersonaName?: string): string | undefined => {
    if (!botPersonaName) return undefined;
    
    // Remove # prefix if it exists (game sends bot names with # prefix)
    const key = botPersonaName.startsWith('#') ? botPersonaName.slice(1) : botPersonaName;
    
    return botNames[key] || botPersonaName;
  };

  return { getBotName, loaded };
};
