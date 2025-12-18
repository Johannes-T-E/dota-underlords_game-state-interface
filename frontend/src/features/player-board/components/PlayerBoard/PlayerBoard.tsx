import React, { useState, useEffect, useRef } from 'react';
import { Button, HeroPortrait, PlayerNameDisplay } from '@/components/ui';
import { OpenInNewTabButton } from '@/components/shared/OpenInNewTabButton';
import { MovementTrail } from './components/MovementTrail/MovementTrail';
import { useUnitPositions } from '@/features/player-board/hooks/useUnitPositions';
import { calculatePosition, CELL_SIZE, GAP_SIZE } from '@/features/player-board/utils/positionUtils';
import { useUnitAnimationSettings } from '@/hooks/useSettings';
import { useItemsData } from '@/hooks/useItemsData';
import { getHeroTier } from '@/utils/heroHelpers';
import type { PlayerState, Unit } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import './PlayerBoard.css';

export interface PlayerBoardProps {
  player: PlayerState;
  heroesData: HeroesData | null;
  onClose?: () => void;
  className?: string;
}

interface ActiveTrail {
  key: string;
  entindex: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  unitId: number;
  startTime: number;
}

export const PlayerBoard = ({ player, heroesData, onClose, className = '' }: PlayerBoardProps) => {

  
  const units = player.units || [];
  const { settings: animationSettings } = useUnitAnimationSettings();
  const { itemsData } = useItemsData();
  
  // Track position changes for animations
  const animationStates = useUnitPositions(units);
  
  // Track active trails for movement visualization
  const [activeTrails, setActiveTrails] = useState<ActiveTrail[]>([]);

  // Dynamic scaling state
  const [scale, setScale] = useState(1);
  const boardRef = useRef<HTMLDivElement>(null);

  // Clear trails when player changes
  useEffect(() => {
    setActiveTrails([]);
  }, [player.account_id]);

  // Create trails when units move
  useEffect(() => {
    if (!animationSettings.enablePositionAnimation || !animationSettings.enableMovementTrail) {
      return;
    }

    const now = Date.now();
    const newTrails: ActiveTrail[] = [];

    for (const state of animationStates) {
      if (state.previousPosition) {
        const unit = units.find(u => u.entindex === state.entindex);
        newTrails.push({
          key: `trail-${state.entindex}-${now}`,
          entindex: state.entindex,
          from: state.previousPosition,
          to: state.currentPosition,
          unitId: unit?.unit_id ?? 0,
          startTime: now
        });
      }
    }

    if (newTrails.length > 0) {
      setActiveTrails(prev => [...prev, ...newTrails]);
    }
  }, [animationStates, animationSettings.enablePositionAnimation, animationSettings.enableMovementTrail, units]);

  // Clean up expired trails
  useEffect(() => {
    if (activeTrails.length === 0) return;

    const timer = setTimeout(() => {
      const now = Date.now();
      setActiveTrails(prev => 
        prev.filter(trail => now - trail.startTime < animationSettings.animationDuration)
      );
    }, animationSettings.animationDuration + 50);

    return () => clearTimeout(timer);
  }, [activeTrails, animationSettings.animationDuration]);

  // Calculate dynamic scale to fit available width
  useEffect(() => {
    const calculateScale = () => {
      if (!boardRef.current) return;
      
      const board = boardRef.current;
      const boardWidth = board.scrollWidth;
      
      const boardVisualizer = board.closest('.board-visualizer');
      if (!boardVisualizer) return;
      
      const totalAvailableWidth = boardVisualizer.clientWidth;
      const padding = 40;
      const gap = 60;
      const availableWidthPerBoard = (totalAvailableWidth - padding - gap) / 4;
      
      const newScale = Math.min(1, availableWidthPerBoard / boardWidth);
      setScale(newScale);
    };

    calculateScale();
    const timeoutId = setTimeout(calculateScale, 100);
    window.addEventListener('resize', calculateScale);
    
    return () => {
      window.removeEventListener('resize', calculateScale);
      clearTimeout(timeoutId);
    };
  }, [units]);

  // Render a unit at its position with CSS transitions
  const renderAnimatedUnit = (unit: Unit) => {
    if (!unit.position) return null;

    const state = animationStates.find(s => s.entindex === unit.entindex);
    const position = calculatePosition(unit.position.x, unit.position.y);
    const isNew = state?.isNew ?? false;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: position.x,
      top: position.y,
      transform: 'translate(-50%, -50%)',
      transition: animationSettings.enablePositionAnimation && !isNew
        ? `left ${animationSettings.animationDuration}ms ease-out, top ${animationSettings.animationDuration}ms ease-out`
        : 'none',
      zIndex: 10
    };

    // Fade-in for new units
    if (isNew && animationSettings.enableNewUnitFade) {
      style.animation = `fadeIn ${animationSettings.animationDuration}ms ease-out forwards`;
      style.opacity = 0;
    }

    return (
      <div
        key={`unit-${unit.entindex}`}
        className="player-board__animated-unit"
        style={style}
        data-entindex={unit.entindex}
      >
        <HeroPortrait 
          unitId={unit.unit_id}
          rank={unit.rank}
          heroesData={heroesData}
          entindex={unit.entindex}
          itemSlots={player.item_slots}
          itemsData={itemsData}
        />
      </div>
    );
  };

  // Create empty grid cells for visual structure
  const rosterCells = [];
  for (let y = 3; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      rosterCells.push(
        <div 
          key={`roster-${x}-${y}`} 
          className="player-board__cell player-board__cell--roster" 
          data-x={x} 
          data-y={y}
        />
      );
    }
  }
  
  const benchCells = [];
  for (let x = 0; x < 8; x++) {
    benchCells.push(
      <div 
        key={`bench-${x}`} 
        className="player-board__cell player-board__cell--bench" 
        data-x={x} 
        data-y="-1"
      />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onClose && (
            <>
              <OpenInNewTabButton href={`/player-board/${player.account_id}`} />
              <Button
                variant="ghost"
                size="small"
                onClick={onClose}
                className="player-board__close-btn"
                aria-label="Close board"
              >
                ×
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="player-board__grid-container">
        {/* Visual grid cells (empty backgrounds) */}
        <div className="player-board__grid">
          <div className="player-board__roster-section">
            {rosterCells}
          </div>
          <div className="player-board__bench-section">
            {benchCells}
          </div>
        </div>

        {/* Movement trails */}
        {animationSettings.enablePositionAnimation && animationSettings.enableMovementTrail && (
          activeTrails.map(trail => (
            <MovementTrail
              key={trail.key}
              fromPosition={trail.from}
              toPosition={trail.to}
              duration={animationSettings.animationDuration}
              trailLength={animationSettings.trailLength}
              cellSize={CELL_SIZE}
              gapSize={GAP_SIZE}
              trailColor={animationSettings.trailColor}
              trailOpacity={animationSettings.trailOpacity}
              trailThickness={animationSettings.trailThickness}
              useTierColor={animationSettings.useTierColor}
              unitId={getHeroTier(trail.unitId, heroesData)}
            />
          ))
        )}

        {/* Animated units overlay */}
        {units.map(renderAnimatedUnit)}
      </div>
    </div>
  );
};
