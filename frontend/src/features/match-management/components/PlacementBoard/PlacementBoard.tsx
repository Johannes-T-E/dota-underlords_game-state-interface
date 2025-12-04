import { Text, Badge, PlayerNameDisplay } from '@/components/ui';
import './PlacementBoard.css';

export interface PlacementPlayer {
  account_id: number;
  persona_name?: string;
  bot_persona_name?: string;
  final_place: number;
  match_count?: number;
}

export interface PlacementBoardProps {
  players: PlacementPlayer[];
  className?: string;
}

export const PlacementBoard = ({ players, className = '' }: PlacementBoardProps) => {
  const sortedPlayers = [...players].sort((a, b) => {
    // Sort by final_place, putting 0 (no result) at the end
    if (a.final_place === 0 && b.final_place > 0) return 1;
    if (a.final_place > 0 && b.final_place === 0) return -1;
    return a.final_place - b.final_place;
  });

  return (
    <div className={`placement-board ${className}`}>
      <Text variant="h3" weight="bold" className="placement-board__title">
        Final Placement
      </Text>
      <table className="placement-board__table">
        <thead>
          <tr>
            <th>Place</th>
            <th>Player</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player, index) => (
            <tr key={player.account_id || index}>
              <td className="placement-board__place">
                {player.final_place > 0 ? `#${player.final_place}` : '—'}
              </td>
              <td className="placement-board__player">
                <PlayerNameDisplay
                  personaName={player.persona_name}
                  botPersonaName={player.bot_persona_name}
                  matchCount={player.match_count}
                />
              </td>
              <td className="placement-board__type">
                {player.bot_persona_name ? (
                  <Badge variant="bot">BOT</Badge>
                ) : (
                  <Text variant="label" color="secondary">Player</Text>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

