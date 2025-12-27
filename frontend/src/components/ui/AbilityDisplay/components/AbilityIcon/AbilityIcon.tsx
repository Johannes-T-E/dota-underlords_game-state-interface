import React, { memo, useState } from 'react';
import { Tooltip } from '../../Tooltip';
import { formatAbilityTooltip, type AbilityDisplayData } from '../../utils';
import './AbilityIcon.css';

export interface AbilityIconProps {
  abilityData: AbilityDisplayData;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * AbilityIcon - Displays an ability icon with hover tooltip
 * 
 * Features:
 * - Memoized for performance
 * - Handles missing icons gracefully
 * - Shows tooltip on hover with full ability information
 */
const AbilityIcon: React.FC<AbilityIconProps> = memo(({
  abilityData,
  size = 'medium',
  className = '',
}) => {
  const [iconError, setIconError] = useState(false);
  
  const tooltipContent = formatAbilityTooltip(
    abilityData.data,
    abilityData.name,
    abilityData.description,
    abilityData.iconPath
  );

  return (
    <Tooltip content={tooltipContent} position="top" className={className}>
      <div className={`ability-icon ability-icon--${size}`}>
        {!iconError && (
          <img
            src={abilityData.iconPath}
            alt={abilityData.name}
            className="ability-icon__image"
            onError={() => setIconError(true)}
          />
        )}
        {iconError && (
          <div className="ability-icon__placeholder">
            {abilityData.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </Tooltip>
  );
});

AbilityIcon.displayName = 'AbilityIcon';

export { AbilityIcon };
export default AbilityIcon;

