import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Button, HeroPortrait, PlayerNameDisplay } from '@/components/ui';
import { MovementTrail } from './components/MovementTrail/MovementTrail';
import { useUnitPositions, type UnitPosition } from '@/features/player-board/hooks/useUnitPositions';
import { useUnitAnimationSettings } from '@/hooks/useSettings';
import { useItemsData } from '@/hooks/useItemsData';
import { getHeroTier } from '@/utils/heroHelpers';
import type { PlayerState } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import './PlayerBoard.css';

export interface PlayerBoardProps {
  player: PlayerState;
  heroesData: HeroesData | null;
  onClose: () => void;
  className?: string;
}

// Define types outside component to avoid recreation
interface ActiveAnimation {
  entindex: number;
  startPosition: UnitPosition;
  endPosition: UnitPosition;
  startTime: number;
  expiryAt: number;
  unitId?: number;
}

type TrailKey = string;
interface ActiveTrail {
  key: TrailKey;
  entindex: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  unitId?: number;
  animationStartTime: number;
  animationDuration: number;
}

export const PlayerBoard = ({ player, heroesData, onClose, className = '' }: PlayerBoardProps) => {
  const units = player.units || [];
  const { settings: animationSettings } = useUnitAnimationSettings();
  const { itemsData } = useItemsData();
  
  // Track effective previous positions (animation targets) for queued animations
  const [effectivePreviousPositions, setEffectivePreviousPositions] = useState<Map<number, UnitPosition>>(new Map());
  
  const animationStates = useUnitPositions(units, effectivePreviousPositions);

  // Dynamic scaling state
  const [scale, setScale] = useState(1);
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Track all timeouts for cleanup on unmount
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  
  // Track active animations with their start and end positions
  const activeAnimationsRef = useRef<Map<number, ActiveAnimation>>(new Map());
  // Queue of pending movements for units that are currently animating
  const movementQueueRef = useRef<Map<number, UnitPosition[]>>(new Map());
  // Force re-render when animations are cleaned up
  const [, setAnimationRerenderTick] = useState(0);
  // Track in-flight trails - tied to active animations
  const activeTrailsRef = useRef<Map<TrailKey, ActiveTrail>>(new Map());
  // Track new unit elements and their target positions for useLayoutEffect positioning
  const newUnitElementsRef = useRef<Map<number, { element: HTMLElement; position: { x: number; y: number } }>>(new Map());
  // Track pending position updates for animated units (set in render, applied in useLayoutEffect)
  const pendingAnimationUpdatesRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  
  // Clear all animation state when player changes
  useEffect(() => {
    // Reset all animation-related refs when player changes
    activeAnimationsRef.current.clear();
    movementQueueRef.current.clear();
    activeTrailsRef.current.clear();
    newUnitElementsRef.current.clear();
    pendingAnimationUpdatesRef.current.clear();
    setEffectivePreviousPositions(new Map());
  }, [player.account_id]);
  
  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(id => clearTimeout(id));
      timeoutsRef.current.clear();
    };
  }, []);

  const shouldShowStaticPortrait = (
    unit: { entindex: number } | undefined,
    animationState: { isMoving?: boolean; isNew?: boolean } | undefined
  ) => {
    if (!unit) return false;
    const moving = Boolean(animationState?.isMoving);
    const isNew = Boolean(animationState?.isNew);
    const activeAnimation = activeAnimationsRef.current.get(unit.entindex);
    const now = Date.now();
    const inFlight = activeAnimation && activeAnimation.expiryAt > now;
    return !moving && !isNew && !inFlight;
  };

  // Calculate dynamic scale to fit available width
  useEffect(() => {
    const calculateScale = () => {
      if (!boardRef.current) return;
      
      const board = boardRef.current;
      const boardWidth = board.scrollWidth;
      
      // Get the total available width from the board visualizer container
      const boardVisualizer = board.closest('.board-visualizer');
      if (!boardVisualizer) return;
      
      const totalAvailableWidth = boardVisualizer.clientWidth;
      const padding = 40; // Total padding (20px on each side)
      const gap = 60; // Total gap between 4 boards (20px * 3 gaps)
      const availableWidthPerBoard = (totalAvailableWidth - padding - gap) / 4;
      
      // Calculate scale to fit 4 boards in the available width
      const newScale = Math.min(1, availableWidthPerBoard / boardWidth);
      setScale(newScale);
    };

    calculateScale();
    
    // Also calculate after a small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(calculateScale, 100);
    
    window.addEventListener('resize', calculateScale);
    
    return () => {
      window.removeEventListener('resize', calculateScale);
      clearTimeout(timeoutId);
    };
  }, [units]); // Recalculate when units change

  // Function to start an animation from startPos to endPos
  const startAnimation = React.useCallback((
    entindex: number,
    startPos: UnitPosition,
    endPos: UnitPosition,
    unitId?: number
  ) => {
    const now = Date.now();
    const duration = animationSettings.animationDuration;
    const expiryAt = now + duration;

    // Create active animation
    const animation: ActiveAnimation = {
      entindex,
      startPosition: startPos,
      endPosition: endPos,
      startTime: now,
      expiryAt,
      unitId
    };
    activeAnimationsRef.current.set(entindex, animation);

    // Create trail for this animation
    if (animationSettings.enablePositionAnimation && animationSettings.enableMovementTrail) {
      const trailKey = `trail-${entindex}-${startPos.x}-${startPos.y}-${endPos.x}-${endPos.y}-${now}`;
      const trail: ActiveTrail = {
        key: trailKey,
        entindex,
        from: startPos,
        to: endPos,
        unitId,
        animationStartTime: now,
        animationDuration: duration
      };
      activeTrailsRef.current.set(trailKey, trail);
      setAnimationRerenderTick(v => v + 1);
    }

    // Update effective previous position to the target
    setEffectivePreviousPositions(prev => {
      const next = new Map(prev);
      next.set(entindex, endPos);
      return next;
    });

    // Schedule cleanup and process queue after animation completes
    const timeoutId = window.setTimeout(() => {
      // Remove this timeout from tracking
      timeoutsRef.current.delete(timeoutId);
      
      const currentAnimation = activeAnimationsRef.current.get(entindex);
      if (currentAnimation && currentAnimation.expiryAt <= Date.now()) {
        // Animation completed
        activeAnimationsRef.current.delete(entindex);
        
        // Remove trail for this animation
        if (animationSettings.enablePositionAnimation && animationSettings.enableMovementTrail) {
          activeTrailsRef.current.forEach((trail, key) => {
            if (trail.entindex === entindex && 
                trail.from.x === startPos.x && trail.from.y === startPos.y &&
                trail.to.x === endPos.x && trail.to.y === endPos.y) {
              activeTrailsRef.current.delete(key);
            }
          });
        }

        // Process queued movement if any
        const queue = movementQueueRef.current.get(entindex);
        if (queue && queue.length > 0) {
          const nextTarget = queue.shift()!;
          movementQueueRef.current.set(entindex, queue);
          
          // Start next animation from current end position to next target
          startAnimation(entindex, endPos, nextTarget, unitId);
        } else {
          // No more queued movements, clear effective position (use actual position)
          setEffectivePreviousPositions(prev => {
            const next = new Map(prev);
            next.delete(entindex);
            return next;
          });
        }
        setAnimationRerenderTick(t => t + 1);
      }
    }, duration + 16);
    
    // Track this timeout for cleanup
    timeoutsRef.current.add(timeoutId);
  }, [animationSettings.animationDuration, animationSettings.enablePositionAnimation, animationSettings.enableMovementTrail]);

  // Maintain a per-unit "in-flight" animation window equal to the transition duration.
  // This prevents a subsequent data update from unmounting the animated overlay mid-flight.
  // Also queues movements if a unit is already animating.
  useEffect(() => {
    const now = Date.now();

    // Process animation states and queue movements if needed
    animationStates.forEach(state => {
      if (state.isMoving && state.oldPosition) {
        const currentAnimation = activeAnimationsRef.current.get(state.entindex);
        const isStillAnimating = currentAnimation && currentAnimation.expiryAt > now;

        if (isStillAnimating) {
          // Unit is still animating, queue this movement
          const queue = movementQueueRef.current.get(state.entindex) || [];
          // Only add if this position is different from the last queued position
          const lastQueued = queue[queue.length - 1];
          if (!lastQueued || lastQueued.x !== state.newPosition.x || lastQueued.y !== state.newPosition.y) {
            queue.push(state.newPosition);
            movementQueueRef.current.set(state.entindex, queue);
          }
        } else {
          // Unit is not animating, start new animation immediately
          const unit = units.find(u => u.entindex === state.entindex);
          startAnimation(
            state.entindex,
            state.oldPosition,
            state.newPosition,
            unit?.unit_id
          );
        }
      }
    });

    // Prune expired animations proactively
    let pruned = false;
    activeAnimationsRef.current.forEach((animation, entindex) => {
      if (animation.expiryAt <= now) {
        activeAnimationsRef.current.delete(entindex);
        pruned = true;
      }
    });
    if (pruned) setAnimationRerenderTick(t => t + 1);
  }, [animationStates, animationSettings.animationDuration, units, startAnimation]);

  // Clean up expired trails (trails are now managed by startAnimation, but we still need to remove them when animations complete)
  useEffect(() => {
    if (!animationSettings.enablePositionAnimation || !animationSettings.enableMovementTrail) return;

    const now = Date.now();

    // Remove trails that have expired (animation duration has passed)
    let pruned = false;
    activeTrailsRef.current.forEach((trail, key) => {
      const elapsed = now - trail.animationStartTime;
      if (elapsed >= trail.animationDuration) {
        activeTrailsRef.current.delete(key);
        pruned = true;
      }
    });
    if (pruned) setAnimationRerenderTick(v => v + 1);
  }, [animationSettings.enablePositionAnimation, animationSettings.enableMovementTrail, animationSettings.animationDuration]);

  // Use useLayoutEffect to position new units after DOM layout but before paint
  useLayoutEffect(() => {
    // Position new units immediately
    if (newUnitElementsRef.current.size > 0) {
      newUnitElementsRef.current.forEach(({ element, position }) => {
        element.style.left = `${position.x}px`;
        element.style.top = `${position.y}px`;
      });
      newUnitElementsRef.current.clear();
    }
    
    // Apply pending animation position updates after a microtask
    // This allows the initial position to be painted first, then the animation triggers
    if (pendingAnimationUpdatesRef.current.size > 0) {
      const updates = new Map(pendingAnimationUpdatesRef.current);
      pendingAnimationUpdatesRef.current.clear();
      
      // Use requestAnimationFrame to ensure the initial position is painted
      // before we update to the final position (which triggers the CSS transition)
      requestAnimationFrame(() => {
        updates.forEach((position, entindex) => {
          const element = document.querySelector(`[data-entindex="${entindex}"]`) as HTMLElement;
          if (element) {
            element.style.left = `${position.x}px`;
            element.style.top = `${position.y}px`;
          }
        });
      });
    }
  });

  // Calculate position for animation - unified coordinate system
  const calculatePosition = (x: number, y: number) => {
    const cellSize = 80;
    const gapSize = 4;
    const sectionGap = 12; // Gap between roster and bench sections
    const padding = 16; // player-board__grid-container padding
    const cellStep = cellSize + gapSize; // 84px
    
    if (y === -1) {
      // Bench position: below 4 rows of roster + section gap
      const benchTop = (4 * cellStep) + sectionGap;
      return {
        x: padding + x * cellStep + cellSize / 2, // Center horizontally + padding
        y: padding + benchTop + cellSize / 2 - 4 // Center vertically + padding - 4px adjustment
      };
    } else {
      // Roster position: y=3→0px, y=2→84px, y=1→168px, y=0→252px
      return {
        x: padding + x * cellStep + cellSize / 2, // Center horizontally + padding
        y: padding + (3 - y) * cellStep + cellSize / 2 // Center vertically + padding
      };
    }
  };

  // Create roster grid cells (y: 0-3)
  const rosterCells = [];
  for (let y = 3; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const unit = units.find(u => u.position && u.position.x === x && u.position.y === y);
      const animationState = animationStates.find(state => state.entindex === unit?.entindex);
      
      rosterCells.push(
        <div key={`roster-${x}-${y}`} className="player-board__cell player-board__cell--roster" data-x={x} data-y={y}>
          {unit && shouldShowStaticPortrait(unit, animationState) && (
            <HeroPortrait 
              unitId={unit.unit_id}
              rank={unit.rank || 0}
              heroesData={heroesData}
              entindex={unit.entindex}
              itemSlots={player.item_slots}
              itemsData={itemsData}
            />
          )}
        </div>
      );
    }
  }
  
  // Create bench grid cells (y: -1)
  const benchCells = [];
  for (let x = 0; x < 8; x++) {
    const unit = units.find(u => u.position && u.position.x === x && u.position.y === -1);
    const animationState = animationStates.find(state => state.entindex === unit?.entindex);
    
    benchCells.push(
      <div key={`bench-${x}`} className="player-board__cell player-board__cell--bench" data-x={x} data-y="-1">
        {unit && shouldShowStaticPortrait(unit, animationState) && (
          <HeroPortrait 
            unitId={unit.unit_id}
            rank={unit.rank || 0}
            heroesData={heroesData}
          />
        )}
      </div>
    );
  }

  return (
    <div 
      ref={boardRef}
      className={`player-board ${className}`} 
      id={`board-${player.account_id}`}
      style={{ zoom: scale, transformOrigin: 'top left' }}
    >
      <div className="player-board__header">
        <PlayerNameDisplay
          personaName={player.persona_name}
          botPersonaName={player.bot_persona_name}
          className="player-board__name"
          matchCount={player.match_count}
        />
        <Button
          variant="ghost"
          size="small"
          onClick={onClose}
          className="player-board__close-btn"
          aria-label="Close board"
        >
          ×
        </Button>
      </div>
      <div className="player-board__grid-container">
        {/* Visual grid cells */}
        <div className="player-board__grid">
          <div className="player-board__roster-section">
            {rosterCells}
          </div>
          <div className="player-board__bench-section">
            {benchCells}
          </div>
        </div>

        {/* Render trails from active store - trails are tied to active animations */}
        {animationSettings.enablePositionAnimation && animationSettings.enableMovementTrail && (
          <>
            {Array.from(activeTrailsRef.current.values()).map(trail => {
              // Only show trail if its animation is still active
              const activeAnimation = activeAnimationsRef.current.get(trail.entindex);
              const isAnimationActive = activeAnimation && 
                activeAnimation.startPosition.x === trail.from.x &&
                activeAnimation.startPosition.y === trail.from.y &&
                activeAnimation.endPosition.x === trail.to.x &&
                activeAnimation.endPosition.y === trail.to.y &&
                activeAnimation.startTime === trail.animationStartTime;
              
              if (!isAnimationActive) return null;
              
              return (
                <MovementTrail
                  key={trail.key}
                  fromPosition={trail.from}
                  toPosition={trail.to}
                  duration={trail.animationDuration}
                  trailLength={animationSettings.trailLength}
                  cellSize={80}
                  gapSize={4}
                  trailColor={animationSettings.trailColor}
                  trailOpacity={animationSettings.trailOpacity}
                  trailThickness={animationSettings.trailThickness}
                  useTierColor={animationSettings.useTierColor}
                  unitId={getHeroTier(trail.unitId || 0, heroesData)}
                />
              );
            })}
          </>
        )}

        {/* Render animated units overlay for ALL units */}
        {animationSettings.enablePositionAnimation && (
          <>
            {units.map(unit => {
              if (!unit.position) return null;
              
              const animationState = animationStates.find(state => state.entindex === unit.entindex);
              const now = Date.now();
              const activeAnimation = activeAnimationsRef.current.get(unit.entindex);
              const isAnimating = activeAnimation && activeAnimation.expiryAt > now;

              // Only show animated version if unit is animating (moving or still in-flight) or new
              if (!isAnimating && !animationState?.isNew) return null;
              
              // For new units, use their actual position directly (no animation target)
              // For animating units, use the active animation's end position
              let targetPosition: UnitPosition;
              let startPosition: { x: number; y: number };
              
              if (animationState?.isNew) {
                // New unit - start at final position immediately (no movement animation, only fade-in if enabled)
                targetPosition = unit.position;
                const finalPosition = calculatePosition(targetPosition.x, targetPosition.y);
                startPosition = finalPosition;
              } else if (activeAnimation) {
                // Currently animating - use animation's start and end positions
                const startPos = calculatePosition(activeAnimation.startPosition.x, activeAnimation.startPosition.y);
                startPosition = startPos;
                targetPosition = activeAnimation.endPosition;
              } else if (animationState?.isMoving && animationState?.oldPosition) {
                // New movement starting - use old and new positions
                startPosition = calculatePosition(animationState.oldPosition.x, animationState.oldPosition.y);
                targetPosition = animationState.newPosition;
              } else {
                // No movement
                targetPosition = unit.position;
                const finalPosition = calculatePosition(targetPosition.x, targetPosition.y);
                startPosition = finalPosition;
              }
              
              const finalPosition = calculatePosition(targetPosition.x, targetPosition.y);
              
              const style: React.CSSProperties = {
                position: 'absolute',
                left: startPosition.x,
                top: startPosition.y,
                transition: animationState?.isNew ? 'none' : `all ${animationSettings.animationDuration}ms ease-out`,
                opacity: animationState?.isNew && animationSettings.enableNewUnitFade ? 0 : 1,
                zIndex: 10
              };

              // Add fade-in animation for new units
              if (animationState?.isNew && animationSettings.enableNewUnitFade) {
                style.animation = `fadeIn ${animationSettings.animationDuration}ms ease-out forwards`;
              }

              // For new units, use ref callback to register element for useLayoutEffect positioning
              // For moving units, queue position update for useLayoutEffect
              const refCallback = animationState?.isNew 
                ? (element: HTMLDivElement | null) => {
                    if (element) {
                      newUnitElementsRef.current.set(unit.entindex, {
                        element,
                        position: finalPosition
                      });
                    } else {
                      newUnitElementsRef.current.delete(unit.entindex);
                    }
                  }
                : (element: HTMLDivElement | null) => {
                    // For moving units, queue position update for useLayoutEffect
                    if (element) {
                      pendingAnimationUpdatesRef.current.set(unit.entindex, finalPosition);
                    }
                  };

              return (
                <div
                  key={`animated-${unit.entindex}`}
                  ref={refCallback}
                  className="player-board__animated-unit"
                  style={style}
                  data-entindex={unit.entindex}
                >
                  <HeroPortrait 
                    unitId={unit.unit_id}
                    rank={unit.rank || 0}
                    heroesData={heroesData}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};