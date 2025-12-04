import { Text } from '@/components/ui';
import { useBotNames } from '@/hooks/useBotNames';
import { MatchCountChip } from '../MatchCountChip/MatchCountChip';
import './PlayerNameDisplay.css';

export interface PlayerNameDisplayProps {
  personaName?: string;
  botPersonaName?: string;
  className?: string;
  matchCount?: number;
}

export const PlayerNameDisplay = ({
  personaName,
  botPersonaName,
  className = '',
  matchCount
}: PlayerNameDisplayProps) => {
  const { getBotName } = useBotNames();

  // Get translated bot name if it exists
  const translatedBotName = botPersonaName ? getBotName(botPersonaName) : undefined;
  
  const longNameLength = 8;

  let fullName: string | undefined = personaName || translatedBotName || botPersonaName;
  let shortName: string | undefined;
  
  if (fullName && fullName.length > longNameLength) {
    shortName = fullName.slice(0, longNameLength) + '...';
  }
  return (
    <span className={`player-name-display-wrapper ${className}`}>
      <Text
        variant="body"
        className="player-name-display"
        title={fullName}
      >
        {shortName || fullName}
      </Text>
      <MatchCountChip count={matchCount || 0} />
    </span>
  );
};

