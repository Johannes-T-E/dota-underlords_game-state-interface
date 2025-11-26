import { Text } from '@/components/ui';
import { useBotNames } from '@/hooks/useBotNames';
import { MatchCountChip } from '../MatchCountChip/MatchCountChip';
import './PlayerNameDisplay.css';

export interface PlayerNameDisplayProps {
  personaName?: string;
  botPersonaName?: string;
  fallback?: string;
  className?: string;
  matchCount?: number;
}

export const PlayerNameDisplay = ({ 
  personaName, 
  botPersonaName, 
  fallback = 'Unknown Player',
  className = '',
  matchCount
}: PlayerNameDisplayProps) => {
  const { getBotName } = useBotNames();
  
  // Get translated bot name if it exists
  const translatedBotName = botPersonaName ? getBotName(botPersonaName) : undefined;
  
  const name = personaName || translatedBotName || botPersonaName || fallback;

  return (
    <span className={`player-name-display-wrapper ${className}`}>
      <MatchCountChip count={matchCount || 0} />
      <Text 
        variant="body" 
        className="player-name-display"
        title={name}
      >
        {name}
      </Text>
    </span>
  );
};

