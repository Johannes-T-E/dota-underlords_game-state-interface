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

// Helper function to get player_id with fallback to account_id
const getPlayerId = (player: PlayerState): string => {
  return player.player_id || String(player.account_id);
};

// Separate component to handle player changes hook
const PlayerRowWithChanges = ({ 
  player, 
  rank, 
  isSelected, 
  onClick, 
  heroesData, 
  visibleColumns,
  columnOrder
}: {
  player: PlayerState;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
  heroesData: any;
  visibleColumns: ScoreboardColumnConfig;
  columnOrder?: string[];
}) => {
  const playerId = getPlayerId(player);
  const changeEvents = usePlayerChanges(playerId, player);
  
  return (
    <ScoreboardPlayerRow
      player={player}
      rank={rank}
      isSelected={isSelected}
      onClick={onClick}
      changeEvents={changeEvents}
      heroesData={heroesData}
      visibleColumns={visibleColumns}
      columnOrder={columnOrder}
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

  const handleColumnReorder = (newOrder: string[]) => {
    updateColumns({ columnOrder: newOrder });
  };

  const sortedPlayers = useMemo(() => {
    const sorted = [...players];

    sorted.sort((a: PlayerState, b: PlayerState) => {
      // Separate active players (final_place === 0) from knocked-out players (final_place > 0)
      const aKnockedOut = (a.final_place || 0) > 0;
      const bKnockedOut = (b.final_place || 0) > 0;

      // Active players come first
      if (!aKnockedOut && bKnockedOut) return -1;
      if (aKnockedOut && !bKnockedOut) return 1;

      // If both are knocked out, sort by final_place (8th at bottom, 1st at top of knocked-out section)
      if (aKnockedOut && bKnockedOut) {
        return (b.final_place || 0) - (a.final_place || 0); // Descending: 8, 7, 6, ..., 1
      }

      // Both are active players - sort by selected field
      let aValue = 0;
      let bValue = 0;

      switch (sortField) {
        case 'health':
          aValue = a.health || 0;
          bValue = b.health || 0;
          break;
        case 'record':
          aValue = (a.wins || 0) - (a.losses || 0);
          bValue = (b.wins || 0) - (b.losses || 0);
          break;
        case 'networth':
          aValue = a.net_worth || 0;
          bValue = b.net_worth || 0;
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
        const player = players.find(p => getPlayerId(p) === playerId);
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
        columnOrder={visibleColumns.columnOrder}
        onColumnReorder={handleColumnReorder}
      />

      <div className="scoreboard-table__players">
        {sortedPlayers.map((player, index) => {
          const playerId = getPlayerId(player);
          return (
            <PlayerRowWithChanges
              key={playerId}
              player={player}
              rank={index + 1}
              isSelected={selectedPlayerIds.includes(playerId)}
              onClick={() => onPlayerSelect(playerId)}
              heroesData={heroesData}
              visibleColumns={visibleColumns}
              columnOrder={visibleColumns.columnOrder}
            />
          );
        })}
      </div>
    </div>
  );
};

