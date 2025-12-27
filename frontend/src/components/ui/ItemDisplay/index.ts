// Main ItemDisplay component
export { default as ItemDisplay } from './ItemDisplay';
export type { ItemDisplayProps } from './ItemDisplay';

// Subcomponents for direct usage
export { ItemIcon } from './components';
export type { ItemIconProps } from './components';

// Tooltip component
export { Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';

// Utility exports
export {
  getItemIconPath,
  getItemName,
  getItemDescription,
  formatItemTooltip,
  processItemForDisplay,
  getAllItems,
} from './utils';
export type {
  ItemDisplayData,
} from './utils';

