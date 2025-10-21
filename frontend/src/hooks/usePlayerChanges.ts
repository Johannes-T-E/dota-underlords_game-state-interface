import { useState, useEffect, useRef } from 'react';
import { PlayerState } from '../types';

export interface ChangeEvent {
  type: 'gold' | 'health' | 'level' | 'units';
  delta: number;
  timestamp: number;
}

export const usePlayerChanges = (_playerId: string, currentPlayer: PlayerState | null) => {
  const [changeEvents, setChangeEvents] = useState<ChangeEvent[]>([]);
  const previousPlayerRef = useRef<PlayerState | null>(null);

  useEffect(() => {
    if (!currentPlayer || !previousPlayerRef.current) {
      previousPlayerRef.current = currentPlayer;
      return;
    }

    const previousPlayer = previousPlayerRef.current;
    const newEvents: ChangeEvent[] = [];

    // Check for gold changes
    if (currentPlayer.gold !== previousPlayer.gold) {
      newEvents.push({
        type: 'gold',
        delta: currentPlayer.gold - previousPlayer.gold,
        timestamp: Date.now(),
      });
    }

    // Check for health changes
    if (currentPlayer.health !== previousPlayer.health) {
      newEvents.push({
        type: 'health',
        delta: currentPlayer.health - previousPlayer.health,
        timestamp: Date.now(),
      });
    }

    // Check for level changes
    if (currentPlayer.level !== previousPlayer.level) {
      newEvents.push({
        type: 'level',
        delta: currentPlayer.level - previousPlayer.level,
        timestamp: Date.now(),
      });
    }

    // Check for units changes (simplified - just check if units array changed)
    const unitsChanged = JSON.stringify(currentPlayer.units) !== JSON.stringify(previousPlayer.units);
    if (unitsChanged) {
      newEvents.push({
        type: 'units',
        delta: 1,
        timestamp: Date.now(),
      });
    }

    // Add new events
    if (newEvents.length > 0) {
      setChangeEvents(prev => [...newEvents, ...prev].slice(0, 10)); // Keep last 10 events
    }

    // Update previous player
    previousPlayerRef.current = currentPlayer;
  }, [currentPlayer]);

  // Auto-remove events after 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setChangeEvents(prev => 
        prev.filter(event => now - event.timestamp < 4000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return changeEvents;
};
