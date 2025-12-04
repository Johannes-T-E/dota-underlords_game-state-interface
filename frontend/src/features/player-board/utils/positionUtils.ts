/**
 * Position calculation utilities for the PlayerBoard
 * Shared between PlayerBoard and MovementTrail components
 */

// Grid layout constants
export const CELL_SIZE = 80;
export const GAP_SIZE = 4;
export const SECTION_GAP = 12; // Gap between roster and bench sections
export const PADDING = 16; // player-board__grid-container padding
export const CELL_STEP = CELL_SIZE + GAP_SIZE; // 84px

export interface PixelPosition {
  x: number;
  y: number;
}

export interface GridPosition {
  x: number;
  y: number;
}

/**
 * Calculate pixel position for a grid coordinate
 * Used for positioning animated units and trails
 * 
 * @param gridX - Grid X coordinate (0-7)
 * @param gridY - Grid Y coordinate (-1 for bench, 0-3 for roster)
 * @returns Pixel position centered in the cell
 */
export const calculatePosition = (gridX: number, gridY: number): PixelPosition => {
  if (gridY === -1) {
    // Bench position: below 4 rows of roster + section gap
    const benchTop = (4 * CELL_STEP) + SECTION_GAP;
    return {
      x: PADDING + gridX * CELL_STEP + CELL_SIZE / 2,
      y: PADDING + benchTop + CELL_SIZE / 2 - 4 // -4px adjustment for visual alignment
    };
  } else {
    // Roster position: y=3→top, y=0→bottom
    return {
      x: PADDING + gridX * CELL_STEP + CELL_SIZE / 2,
      y: PADDING + (3 - gridY) * CELL_STEP + CELL_SIZE / 2
    };
  }
};

/**
 * Check if a grid position is valid
 */
export const isValidGridPosition = (gridX: number, gridY: number): boolean => {
  const validX = gridX >= 0 && gridX <= 7;
  const validY = gridY >= -1 && gridY <= 3;
  return validX && validY;
};

