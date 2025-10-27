import { Text } from '../../atoms';
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
  const name = personaName || botPersonaName || fallback;

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

