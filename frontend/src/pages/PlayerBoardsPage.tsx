import { useMemo, useState, useEffect } from 'react';
import { AppLayout, MainContentTemplate } from '@/components/layout';
import { PlayerBoard } from '@/features/player-board/components/PlayerBoard/PlayerBoard';
import { EmptyState } from '@/components/shared';
import { Button } from '@/components/ui';
import { useAppSelector } from '@/hooks/redux';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { PlayerBoardScaler } from '@/pages/PlayerBoardScaler';
import './PlayerBoardsPage.css';

const BOARDS_PER_ROW_KEY = 'playerBoardsPerRow';
const DEFAULT_BOARDS_PER_ROW = 4;
const MIN_BOARDS_PER_ROW = 1;
const MAX_BOARDS_PER_ROW = 8;

export const PlayerBoardsPage = () => {
  const { currentMatch, players } = useAppSelector((state) => state.match);
  const { heroesData } = useHeroesDataContext();
  
  // Load boards per row from localStorage
  const [boardsPerRow, setBoardsPerRow] = useState(() => {
    try {
      const saved = localStorage.getItem(BOARDS_PER_ROW_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= MIN_BOARDS_PER_ROW && parsed <= MAX_BOARDS_PER_ROW) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load boards per row setting:', error);
    }
    return DEFAULT_BOARDS_PER_ROW;
  });
  
  // Save to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(BOARDS_PER_ROW_KEY, boardsPerRow.toString());
    } catch (error) {
      console.warn('Failed to save boards per row setting:', error);
    }
  }, [boardsPerRow]);
  
  // Get valid players (with account_id)
  const validPlayers = useMemo(() => {
    if (!players || !Array.isArray(players)) {
      return [];
    }
    return players.filter((player) => {
      if (!player) return false;
      return player.account_id != null && player.account_id !== undefined;
    });
  }, [players]);
  
  // Calculate number of rows needed
  const numRows = useMemo(() => {
    if (validPlayers.length === 0) return 0;
    return Math.ceil(validPlayers.length / boardsPerRow);
  }, [validPlayers.length, boardsPerRow]);

  return (
    <AppLayout>
      <MainContentTemplate className="player-boards-page" centered={false}>
        <div className="player-boards-page__container">
          <div className="player-boards-page__header">
            <h1 className="player-boards-page__title">Player Boards</h1>
            <div className="player-boards-page__controls">
              <span className="player-boards-page__label">Boards per row:</span>
              <div className="player-boards-page__buttons">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <Button
                    key={num}
                    variant={boardsPerRow === num ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => setBoardsPerRow(num)}
                    className="player-boards-page__button"
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {!currentMatch ? (
            <div className="player-boards-page__empty">
              <EmptyState
                title="No Active Match"
                message="Waiting for GSI data from Dota Underlords..."
                showSpinner
              />
            </div>
          ) : validPlayers.length === 0 ? (
            <div className="player-boards-page__empty">
              <EmptyState
                title="No Player Boards Available"
                message="No valid player boards found in current match."
                showSpinner={false}
              />
            </div>
          ) : (
            <div 
              className="player-boards-page__grid"
              style={{ 
                gridTemplateColumns: `repeat(${boardsPerRow}, 1fr)`
              }}
            >
              {validPlayers.map((player) => (
                <div key={player.account_id} className="player-boards-page__grid-item">
                  <PlayerBoardScaler>
                    <PlayerBoard
                      player={player}
                      heroesData={heroesData}
                      onClose={() => {
                        // No-op: Individual boards don't need close functionality in this view
                      }}
                    />
                  </PlayerBoardScaler>
                </div>
              ))}
            </div>
          )}
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};

