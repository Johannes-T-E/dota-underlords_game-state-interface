import { useState, useMemo, useEffect, useRef } from 'react';
import { ScoreboardHeader } from '../ScoreboardHeader/ScoreboardHeader';
import { ScoreboardPlayerRow } from '../ScoreboardPlayerRow/ScoreboardPlayerRow';
import { ScoreboardSettings } from '../ScoreboardSettings/ScoreboardSettings';
import { usePlayerChanges } from '../../../hooks/usePlayerChanges';
import { useHeroesData } from '../../../hooks/useHeroesData';
import { useScoreboardSettings } from '../../../hooks/useSettings';
import type { PlayerState, ScoreboardColumnConfig } from '../../../types';
import type { SortField } from '../ScoreboardHeader/ScoreboardHeader';
import './ScoreboardTable.css';

// Separate component to handle player changes hook
const PlayerRowWithChanges = ({ 
  player, 
  rank, 
  isSelected, 
  onClick, 
  heroesData, 
  visibleColumns 
}: {
  player: PlayerState;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
  heroesData: any;
  visibleColumns: ScoreboardColumnConfig;
}) => {
  const changeEvents = usePlayerChanges(player.player_id, player);
  
  return (
    <ScoreboardPlayerRow
      player={player}
      rank={rank}
      isSelected={isSelected}
      onClick={onClick}
      changeEvents={changeEvents}
      heroesData={heroesData}
      visibleColumns={visibleColumns}
    />
  );
};

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
  // Get settings from Redux
  const { settings, updateColumns, updateSort } = useScoreboardSettings();
  const { columns: visibleColumns, sortField, sortDirection } = settings;
  
  const [scale, setScale] = useState(1);
  const tableRef = useRef<HTMLDivElement>(null);
  const { heroesData } = useHeroesData();

  // Calculate dynamic scale to fit available width
  useEffect(() => {
    const calculateScale = () => {
      if (!tableRef.current) return;
      
      const table = tableRef.current;
      const tableWidth = table.scrollWidth;
      const parent = table.parentElement;
      if (!parent) return;
      
      const availableWidth = parent.clientWidth;
      
      // Calculate scale to fit (with some padding)
      const newScale = Math.min(1, (availableWidth - 20) / tableWidth);
      setScale(newScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    
    return () => window.removeEventListener('resize', calculateScale);
  }, [visibleColumns]); // Recalculate when columns change

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      updateSort({ direction: sortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      updateSort({ field, direction: 'desc' });
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
    <div 
      ref={tableRef}
      className={`scoreboard-table ${className}`}
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
    >
      <div className="scoreboard-table__controls">
        <div className="scoreboard-table__controls-spacer" />
        <ScoreboardSettings 
          config={visibleColumns}
          onChange={updateColumns}
        />
      </div>
      <ScoreboardHeader
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        visibleColumns={visibleColumns}
      />

      <div className="scoreboard-table__players">
        {sortedPlayers.map((player, index) => (
          <PlayerRowWithChanges
            key={player.player_id}
            player={player}
            rank={index + 1}
            isSelected={selectedPlayerIds.includes(player.player_id)}
            onClick={() => onPlayerSelect(player.player_id)}
            heroesData={heroesData}
            visibleColumns={visibleColumns}
          />
        ))}
      </div>
    </div>
  );
};

