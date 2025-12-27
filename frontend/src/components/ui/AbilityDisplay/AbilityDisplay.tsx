import React, { useMemo, memo } from 'react';
import { AbilityIcon } from './components';
import { processAbilityForDisplay, type AbilitiesData, type AbilityDescriptions } from './utils';
import './AbilityDisplay.css';

export interface AbilityDisplayProps {
  abilityNames: string[];
  abilitiesData: AbilitiesData | null;
  abilityDescriptions: AbilityDescriptions | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * AbilityDisplay - Displays multiple ability icons horizontally
 * 
 * Features:
 * - Displays all abilities for a hero
 * - Each ability shows icon with hover tooltip
 * - Memoized for performance
 * - Handles missing abilities gracefully
 */
const AbilityDisplay: React.FC<AbilityDisplayProps> = memo(({
  abilityNames,
  abilitiesData,
  abilityDescriptions,
  size = 'medium',
  className = '',
}) => {
  // Process all abilities into display data
  const processedAbilities = useMemo(() => {
    if (!abilityNames || abilityNames.length === 0) return [];
    
    return abilityNames.map(abilityName =>
      processAbilityForDisplay(abilityName, abilitiesData, abilityDescriptions)
    );
  }, [abilityNames, abilitiesData, abilityDescriptions]);

  if (processedAbilities.length === 0) {
    return null;
  }

  return (
    <div className={`ability-display ability-display--${size} ${className}`}>
      {processedAbilities.map((ability, index) => (
        <AbilityIcon
          key={`${ability.abilityName}-${index}`}
          abilityData={ability}
          size={size}
        />
      ))}
    </div>
  );
});

AbilityDisplay.displayName = 'AbilityDisplay';

export default AbilityDisplay;

