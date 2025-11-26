import { useState, useMemo, useEffect, useRef } from 'react';
import { ScoreboardHeader } from '@/features/scoreboard/components/ScoreboardHeader/ScoreboardHeader';
import { ScoreboardPlayerRow } from '@/features/scoreboard/components/ScoreboardPlayerRow/ScoreboardPlayerRow';
import { ScoreboardSettings } from '@/features/scoreboard/components/ScoreboardSettings/ScoreboardSettings';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { useScoreboardSettings } from '@/features/scoreboard/hooks/useScoreboardSettings';
import type { PlayerState } from '@/types';
import type { SortField } from '@/features/scoreboard/components/ScoreboardHeader/ScoreboardHeader';
import './ScoreboardTable.css';

export interface ScoreboardTableProps {
  players: PlayerState[];
  widgetId: string; // Widget identifier for per-widget settings
  className?: string;
}

export const ScoreboardTable = ({ 
  players,
  widgetId,
  className = ''
}: ScoreboardTableProps) => {
  // Get settings from Redux for this specific widget
  const { settings, updateColumns, updateSort } = useScoreboardSettings(widgetId);
  const { columns: visibleColumns, sortField, sortDirection } = settings;
  
  const tableRef = useRef<HTMLDivElement>(null);
  const { heroesData } = useHeroesDataContext();
  
  // State for unit highlighting - support multiple selections
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<number>>(new Set());
  
  const handleUnitClick = (unitId: number) => {
    // Toggle: if unit is already selected, remove it; otherwise add it
    setSelectedUnitIds(prev => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

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

      // If both are knocked out, sort by final_place (1st at top, 8th at bottom)
      if (aKnockedOut && bKnockedOut) {
        return (a.final_place || 0) - (b.final_place || 0); // Ascending: 1, 2, 3, ..., 8
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


  if (players.length === 0) {
    return null;
  }

  return (
    <div 
      ref={tableRef}
      className={`scoreboard-table ${className}`}
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
          return (
            <ScoreboardPlayerRow
              key={player.account_id}
              player={player}
              rank={index + 1}
              heroesData={heroesData}
              visibleColumns={visibleColumns}
              columnOrder={visibleColumns.columnOrder}
              selectedUnitIds={selectedUnitIds}
              onUnitClick={handleUnitClick}
            />
          );
        })}
      </div>
    </div>
  );
};

