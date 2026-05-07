import { ScoreboardPlayerRow } from '@/features/scoreboard/components/ScoreboardPlayerRow/ScoreboardPlayerRow';
import type { PlayerState, ScoreboardColumnConfig } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import { Text } from '@/components/ui';
import './ScoutPlayerList.css';

interface ScoutPlayerListProps {
  players: PlayerState[];
  selectedAccountId?: number | null;
  heroesData: HeroesData | null;
  onSelectPlayer: (accountId: number) => void;
}

const compactColumns: ScoreboardColumnConfig = {
  place: false,
  player: false,
  playerName: true,
  level: false,
  gold: false,
  streak: false,
  health: false,
  record: false,
  networth: false,
  roster: false,
  underlord: false,
  contraptions: false,
  bench: false,
  synergies: false,
};

const columnOrder = ['playerName'];

export const ScoutPlayerList = ({
  players,
  selectedAccountId,
  heroesData,
  onSelectPlayer,
}: ScoutPlayerListProps) => {
  return (
    <section className="scout-player-list">
      <div className="scout-player-list__header">
        <Text variant="label">From the perspective of:</Text>
      </div>
      <div className="scout-player-list__rows app-scrollbar">
        {players.map((player, index) => (
          <div
            key={player.account_id}
            role="button"
            tabIndex={0}
            className={`scout-player-list__row ${player.account_id === selectedAccountId ? 'scout-player-list__row--selected' : ''}`}
            onClick={() => onSelectPlayer(player.account_id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectPlayer(player.account_id);
              }
            }}
          >
            <ScoreboardPlayerRow
              player={player}
              rank={index + 1}
              heroesData={heroesData}
              visibleColumns={compactColumns}
              columnOrder={columnOrder}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
