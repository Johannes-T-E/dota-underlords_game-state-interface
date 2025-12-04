import { useRef, useMemo } from 'react';
import type { Unit } from '@/types';

export interface UnitPosition {
  x: number;
  y: number;
}

export interface UnitAnimationState {
  entindex: number;
  isNew: boolean;
  previousPosition: UnitPosition | null;
  currentPosition: UnitPosition;
}

/**
 * Hook to track unit positions and detect new units
 * Simplified version that lets CSS transitions handle animation
 * 
 * @param units - Current units array
 * @returns Array of animation states for each unit
 */
export const useUnitPositions = (units: Unit[]): UnitAnimationState[] => {
  const previousPositionsRef = useRef<Map<number, UnitPosition>>(new Map());
  const knownUnitsRef = useRef<Set<number>>(new Set());
  const isInitializedRef = useRef<boolean>(false);

  const animationStates = useMemo(() => {
    const states: UnitAnimationState[] = [];
    const currentPositions = new Map<number, UnitPosition>();
    const currentEntindexes = new Set<number>();

    // Build current state
    for (const unit of units) {
      if (!unit.position) continue;
      
      const position: UnitPosition = { x: unit.position.x, y: unit.position.y };
      currentPositions.set(unit.entindex, position);
      currentEntindexes.add(unit.entindex);
    }

    // On first render with data, initialize refs without marking units as new
    if (!isInitializedRef.current && currentPositions.size > 0) {
      previousPositionsRef.current = new Map(currentPositions);
      knownUnitsRef.current = new Set(currentEntindexes);
      isInitializedRef.current = true;
      
      // Return states with no animations on initial render
      for (const unit of units) {
        if (!unit.position) continue;
        states.push({
          entindex: unit.entindex,
          isNew: false,
          previousPosition: null,
          currentPosition: { x: unit.position.x, y: unit.position.y }
        });
      }
      return states;
    }

    // Check each unit's state
    for (const unit of units) {
      if (!unit.position) continue;

      const currentPosition: UnitPosition = { x: unit.position.x, y: unit.position.y };
      const wasKnown = knownUnitsRef.current.has(unit.entindex);
      const previousPosition = previousPositionsRef.current.get(unit.entindex) ?? null;

      const isNew = !wasKnown;
      
      // Only include previousPosition if it's different (for trails)
      const hasMoved = previousPosition && (
        previousPosition.x !== currentPosition.x || 
        previousPosition.y !== currentPosition.y
      );

      states.push({
        entindex: unit.entindex,
        isNew,
        previousPosition: hasMoved ? previousPosition : null,
        currentPosition
      });
    }

    // Update refs for next render
    previousPositionsRef.current = currentPositions;
    knownUnitsRef.current = currentEntindexes;

    return states;
  }, [units]);

  return animationStates;
};
