import { Text } from '../../atoms';
import { useBotNames } from '../../../hooks/useBotNames';
import './PlayerNameDisplay.css';

export interface PlayerNameDisplayProps {
  personaName?: string;
  botPersonaName?: string;
  fallback?: string;
  className?: string;
}

export const PlayerNameDisplay = ({ 
  personaName, 
  botPersonaName, 
  fallback = 'Unknown Player',
  className = '' 
}: PlayerNameDisplayProps) => {
  const { getBotName } = useBotNames();
  
  // Get translated bot name if it exists
  const translatedBotName = botPersonaName ? getBotName(botPersonaName) : undefined;
  
  const name = personaName || translatedBotName || botPersonaName || fallback;

  return (
    <Text 
      variant="body" 
      className={`player-name-display ${className}`}
      title={name}
    >
      {name}
    </Text>
  );
};

