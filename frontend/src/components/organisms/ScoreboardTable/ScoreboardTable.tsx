import { useState, useMemo, useEffect } from 'react';
import { ScoreboardHeader } from '../ScoreboardHeader/ScoreboardHeader';
import { ScoreboardPlayerRow } from '../ScoreboardPlayerRow/ScoreboardPlayerRow';
import { usePlayerChanges } from '../../../hooks/usePlayerChanges';
import { useHeroesData } from '../../../hooks/useHeroesData';
import type { PlayerState } from '../../../types';
import type { SortField, SortDirection } from '../ScoreboardHeader/ScoreboardHeader';
import './ScoreboardTable.css';

export interface ScoreboardTableProps {
  players: PlayerState[];
  selectedPlayerIds: string[];
  onPlayerSelect: (playerId: string) => void;
  onPlayerDataUpdate?: (playerId: string, playerData: PlayerState) => void;
  className?: string;
}

export const ScoreboardTable = ({ 
  players, 
  selectedPlayerIds,
  onPlayerSelect,
  onPlayerDataUpdate,
  className = ''
}: ScoreboardTableProps) => {
  const [sortField, setSortField] = useState<SortField>('health');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { heroesData } = useHeroesData();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedPlayers = useMemo(() => {
    const sorted = [...players];

    sorted.sort((a: PlayerState, b: PlayerState) => {
      let aValue = 0;
      let bValue = 0;

      switch (sortField) {
        case 'health':
          aValue = a.health;
          bValue = b.health;
          break;
        case 'record':
          aValue = a.wins - a.losses;
          bValue = b.wins - b.losses;
          break;
        case 'networth':
          aValue = a.net_worth;
          bValue = b.net_worth;
          break;
      }

      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return sorted;
  }, [players, sortField, sortDirection]);

  // Update board data for selected players
  useEffect(() => {
    if (onPlayerDataUpdate) {
      selectedPlayerIds.forEach(playerId => {
        const player = players.find(p => p.player_id === playerId);
        if (player) {
          onPlayerDataUpdate(playerId, player);
        }
      });
    }
  }, [players, selectedPlayerIds, onPlayerDataUpdate]);

  if (players.length === 0) {
    return null;
  }

  return (
    <div className={`scoreboard-table ${className}`}>
      <ScoreboardHeader
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <div className="scoreboard-table__players">
        {sortedPlayers.map((player, index) => {
          const PlayerRowWithChanges = () => {
            const changeEvents = usePlayerChanges(player.player_id, player);
            return (
              <ScoreboardPlayerRow
                key={player.player_id}
                player={player}
                rank={index + 1}
                isSelected={selectedPlayerIds.includes(player.player_id)}
                onClick={() => onPlayerSelect(player.player_id)}
                changeEvents={changeEvents}
                heroesData={heroesData}
              />
            );
          };
          return <PlayerRowWithChanges key={player.player_id} />;
        })}
      </div>
    </div>
  );
};

