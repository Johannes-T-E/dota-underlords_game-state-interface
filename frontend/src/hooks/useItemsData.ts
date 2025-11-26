import { useState, useEffect } from 'react';
import type { ItemsData } from '@/utils/itemHelpers';

export const useItemsData = () => {
  const [itemsData, setItemsData] = useState<ItemsData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check localStorage first
    const cached = localStorage.getItem('itemsData');
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setItemsData(data);
        setLoaded(true);
        return;
      } catch (err) {
        console.error('Failed to parse cached items data:', err);
      }
    }

    // If not in cache, fetch from server
    fetch('/items.json')
      .then(res => res.json())
      .then(data => {
        // Store in localStorage for future use
        localStorage.setItem('itemsData', JSON.stringify(data));
        setItemsData(data);
        setLoaded(true);
      })
      .catch(err => {
        console.error('Failed to load items data:', err);
        setLoaded(true);
      });
  }, []);

  return { itemsData, loaded };
};

