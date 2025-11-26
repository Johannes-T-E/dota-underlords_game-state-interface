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
 */
export const useUnitPositions = (units: Unit[]) => {
  const previousUnitsRef = useRef<Map<number, UnitPosition>>(new Map());
  const previousUnitsSetRef = useRef<Set<number>>(new Set());

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

    // Check each current unit for animation state
    units.forEach(unit => {
      if (!unit.position) return;

      const currentPosition = { x: unit.position.x, y: unit.position.y };
      const previousPosition = previousUnitsRef.current.get(unit.entindex);
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
    previousUnitsRef.current = new Map(currentUnitsMap);
    previousUnitsSetRef.current = new Set(currentUnitsSet);

    return states;
  }, [units]);

  return animationStates;
};
