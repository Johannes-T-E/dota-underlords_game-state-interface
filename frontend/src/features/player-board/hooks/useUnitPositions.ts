import { useRef, useMemo } from 'react';
import type { Unit } from '@/types';

export interface UnitPosition {
  x: number;
  y: number;
}

export interface UnitAnimationState {
  entindex: number;       // Use entindex for unique unit identification
  isMoving: boolean;
  isNew: boolean;
  oldPosition?: UnitPosition;
  newPosition: UnitPosition;
}

/**
 * Hook to track unit position changes and detect animations
 * @param units - Current units array
 * @param effectivePreviousPositions - Optional map of effective previous positions (e.g., animation targets) that override stored positions
 */
export const useUnitPositions = (
  units: Unit[],
  effectivePreviousPositions?: Map<number, UnitPosition>
) => {
  const previousUnitsRef = useRef<Map<number, UnitPosition>>(new Map());
  const previousUnitsSetRef = useRef<Set<number>>(new Set());
  const isInitializedRef = useRef<boolean>(false);

  const animationStates = useMemo(() => {
    const currentUnitsMap = new Map<number, UnitPosition>();
    const currentUnitsSet = new Set<number>();
    const states: UnitAnimationState[] = [];

    // Build current units map
    units.forEach(unit => {
      if (unit.position) {
        const position = { x: unit.position.x, y: unit.position.y };
        currentUnitsMap.set(unit.entindex, position);
        currentUnitsSet.add(unit.entindex);
      }
    });

    // On initial load, initialize previous positions with current positions
    // This prevents all units from being marked as "new" on first render
    if (!isInitializedRef.current && currentUnitsMap.size > 0) {
      previousUnitsRef.current = new Map(currentUnitsMap);
      previousUnitsSetRef.current = new Set(currentUnitsSet);
      isInitializedRef.current = true;
    }

    // Check each current unit for animation state
    units.forEach(unit => {
      if (!unit.position) return;

      const currentPosition = { x: unit.position.x, y: unit.position.y };
      // Use effective previous position if provided (for queued animations), otherwise use stored previous position
      const previousPosition = effectivePreviousPositions?.get(unit.entindex) || previousUnitsRef.current.get(unit.entindex);
      const wasInPreviousSet = previousUnitsSetRef.current.has(unit.entindex);

      let isMoving = false;
      let isNew = false;
      let oldPosition: UnitPosition | undefined;

      if (!wasInPreviousSet) {
        // Unit is new
        isNew = true;
      } else if (previousPosition) {
        // Unit existed before, check if position changed
        const positionChanged = 
          previousPosition.x !== currentPosition.x || 
          previousPosition.y !== currentPosition.y;
        
        if (positionChanged) {
          isMoving = true;
          oldPosition = previousPosition;
        }
      }

      states.push({
        entindex: unit.entindex,
        isMoving,
        isNew,
        oldPosition,
        newPosition: currentPosition
      });
    });

    // Update refs for next render - create new instances to ensure proper updates
    // Only update if we're not using effective positions (to preserve queue state)
    if (!effectivePreviousPositions || effectivePreviousPositions.size === 0) {
      previousUnitsRef.current = new Map(currentUnitsMap);
      previousUnitsSetRef.current = new Set(currentUnitsSet);
    } else {
      // Update refs but use effective positions where available
      const newPreviousMap = new Map(previousUnitsRef.current);
      effectivePreviousPositions.forEach((pos, entindex) => {
        newPreviousMap.set(entindex, pos);
      });
      // Also update with current positions for units not in effective positions
      currentUnitsMap.forEach((pos, entindex) => {
        if (!effectivePreviousPositions.has(entindex)) {
          newPreviousMap.set(entindex, pos);
        }
      });
      previousUnitsRef.current = newPreviousMap;
      previousUnitsSetRef.current = new Set(currentUnitsSet);
    }

    return states;
  }, [units, effectivePreviousPositions]);

  return animationStates;
};

