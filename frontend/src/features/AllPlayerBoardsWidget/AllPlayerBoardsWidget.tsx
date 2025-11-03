import React from 'react';
import { Widget } from '../../components/widgets/Widget';
import { PlayerBoard } from '../../components/organisms/PlayerBoard/PlayerBoard';
import { Button, Text } from '../../components/atoms';
import { useHeroesData } from '../../hooks/useHeroesData';
import { useAppSelector } from '../../hooks/redux';
import type { PlayerState } from '../../types';
import './AllPlayerBoardsWidget.css';

// Wrapper component that scales PlayerBoard to fit available width (like PlayerBoardWidget)
const PlayerBoardScaledWrapper = ({ children }: { children: React.ReactNode }) => {
  const outerRef = React.useRef<HTMLDivElement | null>(null);
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = React.useState(1);
  const [scaledHeight, setScaledHeight] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const recalc = () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;
      const availableWidth = outer.clientWidth;
      const naturalWidth = inner.scrollWidth || inner.clientWidth || 1;
      const naturalHeight = inner.scrollHeight || inner.clientHeight || 0;
      const nextScale = Math.min(1, Math.max(0.1, (availableWidth - 16) / Math.max(1, naturalWidth)));
      setScale(nextScale);
      setScaledHeight(Math.round(naturalHeight * nextScale));
    };

    recalc();
    const roOuter = new ResizeObserver(recalc);
    const roInner = new ResizeObserver(recalc);
    if (outerRef.current) roOuter.observe(outerRef.current);
    if (innerRef.current) roInner.observe(innerRef.current);
    window.addEventListener('resize', recalc);
    return () => {
      roOuter.disconnect();
      roInner.disconnect();
      window.removeEventListener('resize', recalc);
    };
  }, []);

  return (
    <div ref={outerRef} style={{ width: '100%', overflow: 'visible' }}>
      <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top left', height: scaledHeight, overflow: 'visible' }}>
        {children}
      </div>
    </div>
  );
};

export interface AllPlayerBoardsWidgetProps {
  storageKey?: string;
  dragId?: string;
  onHeaderMouseDown?: (e: React.MouseEvent, id: string) => void;
}

export const AllPlayerBoardsWidget = ({ storageKey, dragId, onHeaderMouseDown }: AllPlayerBoardsWidgetProps) => {
  const { heroesData } = useHeroesData();
  // Get all players from match state, not just selected ones
  const { players, currentMatch } = useAppSelector((state) => state.match);
  
  // Helper function to get player_id with fallback to account_id (same as ScoreboardTable)
  const getPlayerId = React.useCallback((player: PlayerState): string => {
    return player.player_id || String(player.account_id);
  }, []);
  
  // Filter out invalid players - need either player_id or account_id
  const validPlayers = React.useMemo(() => {
    const filtered = players.filter((player) => {
      if (!player) return false;
      // Must have either player_id or account_id
      const hasId = (player.player_id != null && player.player_id !== undefined && player.player_id !== '') ||
                    (player.account_id != null && player.account_id !== undefined);
      return hasId;
    });
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[AllPlayerBoardsWidget] Players from match state:', players.length);
      console.log('[AllPlayerBoardsWidget] Valid players after filtering:', filtered.length);
      console.log('[AllPlayerBoardsWidget] Current match:', currentMatch);
      if (filtered.length > 0) {
        console.log('[AllPlayerBoardsWidget] First valid player:', filtered[0]);
        console.log('[AllPlayerBoardsWidget] Player ID for first player:', getPlayerId(filtered[0]));
      }
    }
    
    return filtered;
  }, [players, currentMatch, getPlayerId]);
  
  // Boards per row state with persistence
  const [boardsPerRow, setBoardsPerRow] = React.useState<number>(() => {
    try {
      const saved = localStorage.getItem('allPlayerBoards:boardsPerRow');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 8) {
          return parsed;
        }
      }
    } catch {}
    return 4; // Default to 4 boards per row
  });

  // Persist boardsPerRow to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('allPlayerBoards:boardsPerRow', String(boardsPerRow));
    } catch {}
  }, [boardsPerRow]);

  const hasPlayers = validPlayers.length > 0;

  const handleBoardsPerRowChange = (count: number) => {
    setBoardsPerRow(Math.max(1, Math.min(8, count)));
  };

  // Track which boards are hidden (closed)
  const [hiddenPlayerIds, setHiddenPlayerIds] = React.useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('allPlayerBoards:hidden');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch {}
    return new Set<string>();
  });

  // Persist hidden boards
  React.useEffect(() => {
    try {
      localStorage.setItem('allPlayerBoards:hidden', JSON.stringify(Array.from(hiddenPlayerIds)));
    } catch {}
  }, [hiddenPlayerIds]);

  const handleCloseBoard = React.useCallback((playerId: string) => {
    setHiddenPlayerIds((prev) => new Set(prev).add(playerId));
  }, []);

  // Filter out hidden boards
  const visiblePlayers = React.useMemo(() => {
    return validPlayers.filter((player) => {
      const playerId = getPlayerId(player);
      return !hiddenPlayerIds.has(playerId);
    });
  }, [validPlayers, hiddenPlayerIds, getPlayerId]);

  // Container ref to measure available width
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);
  
  // Calculate max-width for each board based on boards per row
  const updateMaxWidths = React.useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    // Get the actual client width, ensuring we have a valid measurement
    const containerWidth = container.clientWidth;
    if (containerWidth === 0) return; // Skip if not yet measured
    
    const padding = 40; // Total padding (20px each side)
    const gap = 20; // Gap between boards
    const totalGaps = Math.max(0, (boardsPerRow - 1) * gap);
    // Add a small buffer to account for rounding and ensure boards fit
    const buffer = 10; // Small buffer to prevent overflow
    const availableWidth = containerWidth - padding - totalGaps - buffer;
    const maxWidthPerBoard = Math.max(200, availableWidth / boardsPerRow); // Ensure minimum width
    
    // Apply max-width and flex-basis to all board wrappers
    container.querySelectorAll('.all-player-boards-widget__board-wrapper').forEach((wrapper) => {
      const wrapperEl = wrapper as HTMLElement;
      wrapperEl.style.maxWidth = `${maxWidthPerBoard}px`;
      wrapperEl.style.flexBasis = `${maxWidthPerBoard}px`;
      wrapperEl.style.width = `${maxWidthPerBoard}px`; // Explicit width to ensure it respects max-width
    });
  }, [boardsPerRow]);
  
  // Set up ResizeObserver and update widths
  React.useEffect(() => {
    // Clean up previous observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    
    // Initial update
    updateMaxWidths();
    
    // Set up ResizeObserver to watch container size changes
    if (containerRef.current) {
      resizeObserverRef.current = new ResizeObserver(updateMaxWidths);
      resizeObserverRef.current.observe(containerRef.current);
    }
    
    window.addEventListener('resize', updateMaxWidths);
    
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      window.removeEventListener('resize', updateMaxWidths);
    };
  }, [updateMaxWidths, visiblePlayers.length]);

  return (
    <Widget
      title="All Player Boards"
      className="all-player-boards-widget"
      storageKey={storageKey}
      dragId={dragId}
      onHeaderMouseDown={onHeaderMouseDown}
      headerRight={
        hasPlayers && (
          <div 
            className="all-player-boards-widget__controls"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Text variant="label" className="all-player-boards-widget__controls-label">
              Boards per row:
            </Text>
            <div className="all-player-boards-widget__boards-per-row-selector">
              {[1, 2, 3, 4].map((count) => (
                <Button
                  key={count}
                  variant={boardsPerRow === count ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => handleBoardsPerRowChange(count)}
                  className="all-player-boards-widget__boards-per-row-btn"
                  >
                  {count}
                </Button>
                ))}
            </div>
          </div>
        )
      }
    >
      {!hasPlayers ? (
        <div className="all-player-boards-widget__empty">
          {!currentMatch ? (
            <>No active match. Waiting for GSI data...</>
          ) : players.length === 0 ? (
            <>No players found in match data</>
          ) : (
            <>No valid player boards available (found {players.length} players but none passed validation)</>
          )}
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="all-player-boards-widget__container"
        >
          {visiblePlayers.map((player) => {
            const playerId = getPlayerId(player);
            const playerName = player.persona_name || player.bot_persona_name || 'Unknown';

            return (
              <div
                key={playerId}
                className="all-player-boards-widget__board-wrapper"
              >
                <div className="all-player-boards-widget__board-card">
                  <div className="all-player-boards-widget__board-header">
                    <Text variant="body" weight="bold" className="all-player-boards-widget__board-name">
                      {playerName}
                    </Text>
                    <Button
                      variant="ghost"
                      size="small"
                      aria-label="Close board"
                      title="Close"
                      onClick={() => handleCloseBoard(playerId)}
                      className="all-player-boards-widget__board-close-btn"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="all-player-boards-widget__board-inner">
                    <PlayerBoardScaledWrapper>
                      <PlayerBoard
                        player={player}
                        heroesData={heroesData}
                        onClose={() => {
                          // No-op: We handle closing via the header button
                        }}
                      />
                    </PlayerBoardScaledWrapper>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Widget>
  );
};

