import { Button, Text } from '../../atoms';
import { MovementTrail } from '../../atoms';
import { HeroPortrait } from '../../molecules';
import { useUnitPositions } from '../../../hooks/useUnitPositions';
import { useUnitAnimationSettings } from '../../../hooks/useSettings';
import { getHeroTier } from '../../../utils/heroHelpers';
import { useState, useEffect, useRef } from 'react';
import type { PlayerState } from '../../../types';
import type { HeroesData } from '../../../utils/heroHelpers';
import './PlayerBoard.css';

export interface PlayerBoardProps {
  player: PlayerState;
  heroesData: HeroesData | null;
  onClose: () => void;
  className?: string;
}

export const PlayerBoard = ({ player, heroesData, onClose, className = '' }: PlayerBoardProps) => {
  const playerName = player.persona_name || player.bot_persona_name || 'Unknown';
  const units = player.units || [];
  const animationStates = useUnitPositions(units);
  const { settings: animationSettings } = useUnitAnimationSettings();

  // Dynamic scaling state
  const [scale, setScale] = useState(1);
  const boardRef = useRef<HTMLDivElement>(null);
  // Track in-flight animations so overlays stay mounted until CSS transition completes
  const activeAnimationsRef = useRef<Map<number, number>>(new Map()); // entindex -> expiry timestamp
  const [animationRerenderTick, setAnimationRerenderTick] = useState(0);
  // Track in-flight trails so they persist even if isMoving flips
  type TrailKey = string;
  interface ActiveTrail {
    key: TrailKey;
    entindex: number;
    from: { x: number; y: number };
    to: { x: number; y: number };
    unitId?: number;
    expiryAt: number;
  }
  const activeTrailsRef = useRef<Map<TrailKey, ActiveTrail>>(new Map());

  const shouldShowStaticPortrait = (
    unit: { entindex: number } | undefined,
    animationState: { isMoving?: boolean; isNew?: boolean } | undefined
  ) => {
    if (!unit) return false;
    const moving = Boolean(animationState?.isMoving);
    const isNew = Boolean(animationState?.isNew);
    const expiryAt = activeAnimationsRef.current.get(unit.entindex) || 0;
    const inFlight = expiryAt > Date.now();
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

  // Maintain a per-unit "in-flight" animation window equal to the transition duration.
  // This prevents a subsequent data update from unmounting the animated overlay mid-flight.
  useEffect(() => {
    const now = Date.now();
    const expiryDelta = animationSettings.animationDuration;

    // Register newly moving units and schedule cleanup
    animationStates.forEach(state => {
      if (state.isMoving) {
        const expiryAt = now + expiryDelta;
        activeAnimationsRef.current.set(state.entindex, expiryAt);
        // Force a rerender after the animation window to allow unmounting
        window.setTimeout(() => {
          // On timeout, only clear if the stored expiry has passed
          const currentExpiry = activeAnimationsRef.current.get(state.entindex) || 0;
          if (currentExpiry <= Date.now()) {
            activeAnimationsRef.current.delete(state.entindex);
          }
          setAnimationRerenderTick(t => t + 1);
        }, expiryDelta + 16);
      }
    });

    // Also prune any expired entries proactively
    const entries = Array.from(activeAnimationsRef.current.entries());
    let pruned = false;
    entries.forEach(([entindex, expiryAt]) => {
      if (expiryAt <= now) {
        activeAnimationsRef.current.delete(entindex);
        pruned = true;
      }
    });
    if (pruned) setAnimationRerenderTick(t => t + 1);
  }, [animationStates, animationSettings.animationDuration]);

  // Maintain active movement trails with an expiry equal to trail duration
  useEffect(() => {
    if (!animationSettings.enablePositionAnimation || !animationSettings.enableMovementTrail) return;

    const now = Date.now();
    const duration = animationSettings.animationDuration;

    // Add/refresh trails for any newly moving units
    animationStates.forEach(state => {
      if (state.isMoving && state.oldPosition) {
        const key = `trail-${state.entindex}-${state.oldPosition.x}-${state.oldPosition.y}-${state.newPosition.x}-${state.newPosition.y}`;
        const unit = units.find(u => u.entindex === state.entindex);
        const trail: ActiveTrail = {
          key,
          entindex: state.entindex,
          from: state.oldPosition,
          to: state.newPosition,
          unitId: unit?.unit_id,
          expiryAt: now + duration
        };
        activeTrailsRef.current.set(key, trail);
        // Schedule cleanup after duration
        window.setTimeout(() => {
          const t = activeTrailsRef.current.get(key);
          if (t && t.expiryAt <= Date.now()) {
            activeTrailsRef.current.delete(key);
            setAnimationRerenderTick(v => v + 1);
          }
        }, duration + 32);
      }
    });

    // Prune expired trails proactively
    let pruned = false;
    activeTrailsRef.current.forEach((trail, key) => {
      if (trail.expiryAt <= now) {
        activeTrailsRef.current.delete(key);
        pruned = true;
      }
    });
    if (pruned) setAnimationRerenderTick(v => v + 1);
  }, [animationStates, animationSettings.enablePositionAnimation, animationSettings.enableMovementTrail, animationSettings.animationDuration, units]);

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
      const isUnitAnimating = animationState?.isMoving || false;
      const isUnitNew = animationState?.isNew || false;
      
      rosterCells.push(
        <div key={`roster-${x}-${y}`} className="player-board__cell player-board__cell--roster" data-x={x} data-y={y}>
          {shouldShowStaticPortrait(unit, animationState) && (
            <HeroPortrait 
              unitId={unit.unit_id}
              rank={unit.rank || 0}
              heroesData={heroesData}
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
    const isUnitAnimating = animationState?.isMoving || false;
    const isUnitNew = animationState?.isNew || false;
    
    benchCells.push(
      <div key={`bench-${x}`} className="player-board__cell player-board__cell--bench" data-x={x} data-y="-1">
        {shouldShowStaticPortrait(unit, animationState) && (
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
      id={`board-${player.player_id}`}
      style={{ zoom: scale, transformOrigin: 'top left' }}
    >
      <div className="player-board__header">
        <Text variant="h3" weight="bold" className="player-board__name">
          {playerName}
        </Text>
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

        {/* Render trails from active store to prevent abrupt unmounts */}
        {animationSettings.enablePositionAnimation && animationSettings.enableMovementTrail && (
          <>
            {Array.from(activeTrailsRef.current.values()).map(trail => (
              <MovementTrail
                key={trail.key}
                fromPosition={trail.from}
                toPosition={trail.to}
                duration={animationSettings.animationDuration}
                trailLength={animationSettings.trailLength}
                cellSize={80}
                gapSize={4}
                trailColor={animationSettings.trailColor}
                trailOpacity={animationSettings.trailOpacity}
                trailThickness={animationSettings.trailThickness}
                useTierColor={animationSettings.useTierColor}
                unitId={getHeroTier(trail.unitId || 0, heroesData)}
              />
            ))}
          </>
        )}

        {/* Render animated units overlay for ALL units */}
        {animationSettings.enablePositionAnimation && (
          <>
            {units.map(unit => {
              if (!unit.position) return null;
              
              const animationState = animationStates.find(state => state.entindex === unit.entindex);
              const now = Date.now();
              const inFlight = activeAnimationsRef.current.get(unit.entindex);
              const isAnimating = Boolean(animationState?.isMoving) || (inFlight !== undefined && inFlight > now);

              // Only show animated version if unit is animating (moving or still in-flight) or new
              if (!isAnimating && !animationState?.isNew) return null;
              
              const finalPosition = calculatePosition(unit.position.x, unit.position.y);
              
              // For moving units, start from old position
              const startPosition = animationState.isMoving && animationState.oldPosition 
                ? calculatePosition(animationState.oldPosition.x, animationState.oldPosition.y)
                : finalPosition;
              
              const style: React.CSSProperties = {
                position: 'absolute',
                left: startPosition.x,
                top: startPosition.y,
                transition: `all ${animationSettings.animationDuration}ms ease-out`,
                opacity: animationState?.isNew && animationSettings.enableNewUnitFade ? 0 : 1,
                zIndex: 10
              };

              // Add fade-in animation for new units
              if (animationState?.isNew && animationSettings.enableNewUnitFade) {
                style.animation = `fadeIn ${animationSettings.animationDuration}ms ease-out forwards`;
              }

              // Trigger animation to final position after a small delay
              setTimeout(() => {
                const element = document.querySelector(`[data-entindex="${unit.entindex}"]`) as HTMLElement;
                if (element) {
                  element.style.left = `${finalPosition.x}px`;
                  element.style.top = `${finalPosition.y}px`;
                }
              }, 10);

              return (
                <div
                  key={`animated-${unit.entindex}`}
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