import { useState, useRef, useMemo } from 'react';
import { HeroPortrait } from '@/components/ui';
import { calculatePosition } from '@/features/player-board/utils/positionUtils';
import { MAX_BUILD_UNITS, createBuildUnit } from '@/utils/buildHelpers';
import { getSynergyNameByKeyword } from '@/components/ui/SynergyDisplay/utils';
import type { BuildUnit } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import './EditablePlayerBoard.css';

export interface EditablePlayerBoardProps {
  units: BuildUnit[];
  heroesData: HeroesData | null;
  onUnitsChange: (units: BuildUnit[]) => void;
  onUnitSelect?: (unit: BuildUnit | null) => void;
  selectedUnitId?: number | null;
  onClearBoard?: () => void;
  hoveredSynergyKeyword?: number | null;
  className?: string;
}

export const EditablePlayerBoard = ({
  units,
  heroesData,
  onUnitsChange,
  onUnitSelect,
  selectedUnitId,
  onClearBoard,
  hoveredSynergyKeyword = null,
  className = '',
}: EditablePlayerBoardProps) => {
  const [draggedUnit, setDraggedUnit] = useState<BuildUnit | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Generate entindex for display purposes
  const getEntindex = (index: number) => index + 1000;

  // Helper: Get keywords for a BuildUnit
  const getUnitKeywords = (unit: BuildUnit): number[] => {
    if (!heroesData || !heroesData.heroes) return [];
    const heroData = Object.values(heroesData.heroes).find(h => h.id === unit.unit_id);
    return heroData?.keywords || [];
  };

  // Helper: Check if unit has a specific synergy keyword
  const unitHasSynergyKeyword = (unit: BuildUnit, keyword: number): boolean => {
    const keywords = getUnitKeywords(unit);
    return keywords.includes(keyword);
  };

  // Helper: Get synergy color from keyword
  const getSynergyColor = (keyword: number): { primary: string; secondary: string } | undefined => {
    const synergyName = getSynergyNameByKeyword(keyword);
    if (!synergyName) return undefined;
    
    const getComputedColor = (varName: string, fallback: string = '#888888'): string => {
      if (typeof window === 'undefined') return fallback;
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      return value || fallback;
    };
    
    const cssVar = synergyName.toLowerCase();
    const colorVar = `--synergy-${cssVar}-color`;
    const brightColorVar = `--synergy-${cssVar}-color-bright`;
    
    const primary = getComputedColor(colorVar);
    const secondary = getComputedColor(brightColorVar) || primary;
    
    return { primary, secondary };
  };

  // Get synergy colors for hovered synergy
  const synergyColors = useMemo(() => {
    if (!hoveredSynergyKeyword) return null;
    return getSynergyColor(hoveredSynergyKeyword);
  }, [hoveredSynergyKeyword]);

  // Handle cell click to place unit or select unit
  const handleCellClick = (x: number, y: number) => {
    const existingUnit = units.find(
      u => u.position.x === x && u.position.y === y
    );

    if (existingUnit) {
      // Select existing unit
      onUnitSelect?.(existingUnit);
    } else {
      // Deselect
      onUnitSelect?.(null);
    }
  };

  // Handle cell drag over
  const handleCellDragOver = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    e.stopPropagation();
    // Set dropEffect based on whether we're moving an existing unit or adding new
    if (draggedUnit) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'copy';
    }
    setHoveredCell({ x, y });
  };

  // Handle cell drop
  const handleCellDrop = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredCell(null);

    // Check if this is a move operation (existing unit being relocated)
    const isMoveOperation = e.dataTransfer.getData('moveUnit') === 'true';
    let unitToMove = draggedUnit;
    
    // If we have a unit index but no draggedUnit state, find the unit
    if (isMoveOperation && !unitToMove) {
      const unitIndexStr = e.dataTransfer.getData('unitIndex');
      if (unitIndexStr) {
        const unitIndex = parseInt(unitIndexStr, 10);
        if (!isNaN(unitIndex) && unitIndex >= 0 && unitIndex < units.length) {
          unitToMove = units[unitIndex] ?? null;
        }
      }
    }
    
    if (isMoveOperation && unitToMove) {
      // Moving existing unit
      moveUnit(unitToMove, x, y);
      setDraggedUnit(null);
      setIsDragging(false);
      return;
    }

    // Otherwise, this is a new unit being added
    const unitIdStr = e.dataTransfer.getData('unitId');
    if (!unitIdStr) {
      return;
    }

    const unitId = parseInt(unitIdStr, 10);
    if (isNaN(unitId)) {
      return;
    }

    // Check if position is already occupied
    const existingUnit = units.find(
      u => u.position.x === x && u.position.y === y
    );
    if (existingUnit) {
      return;
    }

    // Check unit limit
    if (units.length >= MAX_BUILD_UNITS) {
      alert(`Maximum of ${MAX_BUILD_UNITS} units allowed`);
      return;
    }

    // Add new unit
    const newUnit = createBuildUnit(unitId, { x, y }, 1);
    onUnitsChange([...units, newUnit]);
  };

  // Move existing unit
  const moveUnit = (unit: BuildUnit, newX: number, newY: number) => {
    // Don't move if it's the same position
    if (unit.position.x === newX && unit.position.y === newY) {
      return;
    }

    // Check if new position is occupied
    const existingUnit = units.find(
      u => u !== unit && u.position.x === newX && u.position.y === newY
    );
    if (existingUnit) {
      // Swap positions if dropping on another unit
      const updatedUnits = units.map(u => {
        if (u === unit) {
          return { ...u, position: { x: newX, y: newY } };
        }
        if (u === existingUnit) {
          return { ...u, position: unit.position };
        }
        return u;
      });
      onUnitsChange(updatedUnits);
      return;
    }

    // Move to empty position
    const updatedUnits = units.map(u =>
      u === unit ? { ...u, position: { x: newX, y: newY } } : u
    );
    onUnitsChange(updatedUnits);
  };

  // Handle unit drag start
  const handleUnitDragStart = (e: React.DragEvent, unit: BuildUnit) => {
    setDraggedUnit(unit);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    // Set data to identify this as a move operation
    // Use a unique identifier to distinguish from new unit drags
    e.dataTransfer.setData('moveUnit', 'true');
    e.dataTransfer.setData('unitIndex', units.indexOf(unit).toString());
  };

  // Handle unit drag end
  const handleUnitDragEnd = () => {
    setDraggedUnit(null);
    setHoveredCell(null);
    // Use setTimeout to prevent click event from firing after drag
    setTimeout(() => setIsDragging(false), 0);
  };

  // Handle unit click
  const handleUnitClick = (e: React.MouseEvent, unit: BuildUnit) => {
    e.stopPropagation();
    // Don't select if we just finished dragging
    if (isDragging) {
      return;
    }
    onUnitSelect?.(unit);
  };

  // Handle unit remove
  const handleUnitRemove = (e: React.MouseEvent, unit: BuildUnit) => {
    e.stopPropagation();
    const updatedUnits = units.filter(u => u !== unit);
    onUnitsChange(updatedUnits);
    if (selectedUnitId === unit.unit_id) {
      onUnitSelect?.(null);
    }
  };

  // Create grid cells
  const rosterCells = [];
  for (let y = 3; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const hasUnit = units.some(u => u.position.x === x && u.position.y === y);
      const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
      const isSelected = units.some(
        u => u.position.x === x && u.position.y === y && u.unit_id === selectedUnitId
      );

      rosterCells.push(
        <div
          key={`roster-${x}-${y}`}
          className={`editable-player-board__cell editable-player-board__cell--roster ${
            hasUnit ? 'editable-player-board__cell--occupied' : ''
          } ${isHovered ? 'editable-player-board__cell--hovered' : ''} ${
            isSelected ? 'editable-player-board__cell--selected' : ''
          }`}
          data-x={x}
          data-y={y}
          onClick={() => handleCellClick(x, y)}
          onDragEnter={(e) => {
            e.preventDefault();
            handleCellDragOver(e, x, y);
          }}
          onDragOver={(e) => handleCellDragOver(e, x, y)}
          onDrop={(e) => handleCellDrop(e, x, y)}
          onDragLeave={() => setHoveredCell(null)}
        />
      );
    }
  }

  const benchCells = [];
  for (let x = 0; x < 8; x++) {
    const hasUnit = units.some(u => u.position.x === x && u.position.y === -1);
    const isHovered = hoveredCell?.x === x && hoveredCell?.y === -1;
    const isSelected = units.some(
      u => u.position.x === x && u.position.y === -1 && u.unit_id === selectedUnitId
    );

    benchCells.push(
      <div
        key={`bench-${x}`}
        className={`editable-player-board__cell editable-player-board__cell--bench ${
          hasUnit ? 'editable-player-board__cell--occupied' : ''
        } ${isHovered ? 'editable-player-board__cell--hovered' : ''} ${
          isSelected ? 'editable-player-board__cell--selected' : ''
        }`}
        data-x={x}
        data-y="-1"
        onClick={() => handleCellClick(x, -1)}
        onDragEnter={(e) => {
          e.preventDefault();
          handleCellDragOver(e, x, -1);
        }}
        onDragOver={(e) => handleCellDragOver(e, x, -1)}
        onDrop={(e) => handleCellDrop(e, x, -1)}
        onDragLeave={() => setHoveredCell(null)}
      />
    );
  }

  return (
    <div
      ref={boardRef}
      className={`editable-player-board ${className}`}
    >
      <div className="editable-player-board__header">
        <div className="editable-player-board__title">Build Board</div>
        <div className="editable-player-board__header-right">
          <div className="editable-player-board__unit-count">
            {units.length} / {MAX_BUILD_UNITS}
          </div>
          {onClearBoard && units.length > 0 && (
            <button
              onClick={onClearBoard}
              className="editable-player-board__clear-button"
              title="Clear board"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div 
        className="editable-player-board__grid-container"
        onDragOver={(e) => {
          // Allow drops on the container
          e.preventDefault();
        }}
      >
        <div className="editable-player-board__grid">
          <div className="editable-player-board__roster-section">
            {rosterCells}
          </div>
          <div className="editable-player-board__bench-section">
            {benchCells}
          </div>
        </div>

        {/* Units overlay */}
        {units.map((unit, index) => {
          const position = calculatePosition(unit.position.x, unit.position.y);
          const isSelected = unit.unit_id === selectedUnitId;
          
          // Check if unit has hovered synergy
          const hasHoveredSynergy = hoveredSynergyKeyword !== null 
            ? unitHasSynergyKeyword(unit, hoveredSynergyKeyword)
            : false;
          const isDimmedBySynergy = hoveredSynergyKeyword !== null && !hasHoveredSynergy;
          
          // Use synergy colors if unit has hovered synergy
          const tierColors = hasHoveredSynergy && synergyColors ? synergyColors : undefined;

          return (
            <div
              key={`unit-${unit.unit_id}-${index}`}
              className={`editable-player-board__unit ${
                isSelected ? 'editable-player-board__unit--selected' : ''
              } ${isDimmedBySynergy ? 'editable-player-board__unit--dimmed' : ''}`}
              style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -50%)',
                zIndex: isDragging && draggedUnit === unit ? 100 : 10,
                pointerEvents: 'auto',
              }}
              draggable={true}
              onDragStart={(e) => handleUnitDragStart(e, unit)}
              onDragEnd={handleUnitDragEnd}
              onClick={(e) => handleUnitClick(e, unit)}
            >
              <HeroPortrait
                unitId={unit.unit_id}
                rank={unit.rank}
                heroesData={heroesData}
                entindex={getEntindex(index)}
                tierColors={tierColors}
              />
              <button
                className="editable-player-board__unit-remove"
                onClick={(e) => handleUnitRemove(e, unit)}
                title="Remove unit"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

