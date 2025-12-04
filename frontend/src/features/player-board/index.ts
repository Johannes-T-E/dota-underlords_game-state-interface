// Export player-board components
export { PlayerBoard } from './components/PlayerBoard/PlayerBoard';
export type { PlayerBoardProps } from './components/PlayerBoard/PlayerBoard';

// Export hooks
export { useUnitPositions } from './hooks/useUnitPositions';
export type { UnitPosition, UnitAnimationState } from './hooks/useUnitPositions';

// Export utils
export { 
  calculatePosition, 
  isValidGridPosition,
  CELL_SIZE, 
  GAP_SIZE, 
  SECTION_GAP, 
  PADDING, 
  CELL_STEP 
} from './utils/positionUtils';
export type { PixelPosition, GridPosition } from './utils/positionUtils';
