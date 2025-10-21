import { useState, useMemo } from 'react';
import { useAppSelector } from '../../hooks/redux';
import { PlayerRow } from './PlayerRow';
import type { PlayerState } from '../../types';

type SortField = 'health' | 'record' | 'networth';
type SortDirection = 'asc' | 'desc';

export const ScoreboardTable = () => {
  const { players } = useAppSelector((state) => state.match);
  const [sortField, setSortField] = useState<SortField>('health');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  if (players.length === 0) {
    return null;
  }

  return (
    <div id="scoreboard" className="scoreboard">
      {/* Header Row */}
      <div className="header-row">
        <div className="col-place">#</div>
        <div className="col-player">Player</div>
        <div
          className={`col-health sortable ${sortField === 'health' ? 'active' : ''}`}
          data-sort="health"
          onClick={() => handleSort('health')}
        >
          Health {sortField === 'health' && (sortDirection === 'desc' ? '▼' : '▲')}
        </div>
        <div
          className={`col-record sortable ${sortField === 'record' ? 'active' : ''}`}
          data-sort="record"
          onClick={() => handleSort('record')}
        >
          Record {sortField === 'record' && (sortDirection === 'desc' ? '▼' : '▲')}
        </div>
        <div
          className={`col-networth sortable ${sortField === 'networth' ? 'active' : ''}`}
          data-sort="networth"
          onClick={() => handleSort('networth')}
        >
          Net Worth {sortField === 'networth' && (sortDirection === 'desc' ? '▼' : '▲')}
        </div>
        <div className="col-roster">Roster</div>
        <div className="col-bench">Bench</div>
      </div>

      {/* Player Rows Container */}
      <div id="playersContainer" className="players-container">
        {sortedPlayers.map((player, index) => (
          <PlayerRow key={player.player_id} player={player} rank={index + 1} />
        ))}
      </div>
    </div>
  );
};

