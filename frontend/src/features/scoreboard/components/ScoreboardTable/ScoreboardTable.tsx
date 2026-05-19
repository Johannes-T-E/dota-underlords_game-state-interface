import { useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ScoreboardHeader } from '@/features/scoreboard/components/ScoreboardHeader/ScoreboardHeader';
import { ScoreboardPlayerRow } from '@/features/scoreboard/components/ScoreboardPlayerRow/ScoreboardPlayerRow';
import { SynergyToolbar } from '@/features/scoreboard/components/SynergyToolbar';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { useScoreboardSettings } from '@/features/scoreboard/hooks/useScoreboardSettings';
import { useScoreboardFitScale } from '@/features/scoreboard/hooks/useScoreboardFitScale';
import {
  selectShowSynergyPips,
  selectScoreboardFitToViewport,
  updateShowSynergyPips,
  updateScoreboardFitToViewport,
} from '@/store/settingsSlice';
import { getSynergiesColumnWidth, isSynergyActive } from '@/components/ui/SynergyDisplay/utils';
import { calculatePoolCounts } from '@/utils/poolCalculator';
import type { PlayerState } from '@/types';
import type { SortField } from '@/features/scoreboard/components/ScoreboardHeader/ScoreboardHeader';
import './ScoreboardTable.css';

export interface ScoreboardTableProps {
  players: PlayerState[];
  widgetId: string;
  className?: string;
  selectedUnitIds: Set<number>;
  onUnitClick: (unitId: number) => void;
  selectedSynergyKeyword: number | null;
  onSynergyClick: (keyword: number | null) => void;
}

export const ScoreboardTable = ({ 
  players,
  widgetId,
  className = '',
  selectedUnitIds,
  onUnitClick,
  selectedSynergyKeyword,
  onSynergyClick
}: ScoreboardTableProps) => {
  // Get settings from Redux for this specific widget
  const { settings, updateColumns, updateSort } = useScoreboardSettings(widgetId);
  const { columns: visibleColumns, sortField, sortDirection } = settings;
  
  // Get global synergy pips setting
  const dispatch = useDispatch();
  const showSynergyPips = useSelector(selectShowSynergyPips);
  const fitToViewport = useSelector(selectScoreboardFitToViewport);

  const handleShowSynergyPipsChange = (show: boolean) => {
    dispatch(updateShowSynergyPips(show));
  };

  const handleFitToViewportChange = (fit: boolean) => {
    dispatch(updateScoreboardFitToViewport(fit));
  };

  const tableRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { heroesData } = useHeroesDataContext();

  const poolCounts = useMemo(
    () => calculatePoolCounts(players, heroesData),
    [players, heroesData]
  );

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

  // Calculate max active synergies across all players for dynamic column width
  const maxActiveSynergies = useMemo(() => {
    return players.reduce((max, player) => {
      const activeSynergies = (player.synergies || []).filter(s => isSynergyActive(s));
      return Math.max(max, activeSynergies.length);
    }, 0);
  }, [players]);

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

  const synergiesColumnWidth = useMemo(() => {
    const rowHeight =
      typeof window !== 'undefined'
        ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row-height').trim()) || 80
        : 80;

    return getSynergiesColumnWidth(rowHeight, maxActiveSynergies, showSynergyPips);
  }, [maxActiveSynergies, showSynergyPips]);

  const { scale: fitScale, naturalWidth, naturalHeight } = useScoreboardFitScale(
    fitToViewport,
    scrollRef,
    contentRef,
    [sortedPlayers.length, visibleColumns, showSynergyPips, maxActiveSynergies, synergiesColumnWidth]
  );

  const fitSlotStyle =
    fitToViewport && naturalWidth > 0 && naturalHeight > 0
      ? ({
          width: naturalWidth * fitScale,
          height: naturalHeight * fitScale,
        } as React.CSSProperties)
      : undefined;

  const scaledContentStyle = fitToViewport
    ? ({
        transform: `scale(${fitScale})`,
        transformOrigin: 'top left',
      } as React.CSSProperties)
    : undefined;

  if (players.length === 0) {
    return null;
  }

  // CSS custom property for dynamic synergies column width
  const tableStyle = {
    '--width-synergies-dynamic': `${synergiesColumnWidth}px`,
  } as React.CSSProperties;

  return (
    <div 
      ref={tableRef}
      className={`scoreboard-table ${className}`}
      style={tableStyle}
    >
      <SynergyToolbar
        selectedSynergyKeyword={selectedSynergyKeyword}
        onSynergyClick={onSynergyClick}
        columnConfig={visibleColumns}
        onColumnConfigChange={updateColumns}
        showSynergyPips={showSynergyPips}
        onShowSynergyPipsChange={handleShowSynergyPipsChange}
        fitToViewport={fitToViewport}
        onFitToViewportChange={handleFitToViewportChange}
      />
      <div
        ref={scrollRef}
        className={`scoreboard-table__scroll app-scrollbar ${fitToViewport ? 'scoreboard-table__scroll--fit' : ''}`}
      >
        <div className="scoreboard-table__fit-slot" style={fitSlotStyle}>
          <div
            ref={contentRef}
            className="scoreboard-table__scaled-content"
            style={scaledContentStyle}
          >
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
                poolCounts={poolCounts}
                visibleColumns={visibleColumns}
                columnOrder={visibleColumns.columnOrder}
                selectedUnitIds={selectedUnitIds}
                onUnitClick={onUnitClick}
                selectedSynergyKeyword={selectedSynergyKeyword}
                onSynergyClick={onSynergyClick}
                showSynergyPips={showSynergyPips}
              />
            );
          })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

