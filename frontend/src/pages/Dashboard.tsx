import React from 'react';
import { AppLayout, MainContentTemplate } from '@/components/layout';
import { ScoreboardTable } from '@/features/scoreboard/components/ScoreboardTable/ScoreboardTable';
import { PlayerBoard } from '@/features/player-board/components/PlayerBoard/PlayerBoard';
import { UnitChanges } from '@/features/unit-changes/UnitChanges';
import { EmptyState } from '@/components/shared';
import { useAppSelector } from '@/hooks/redux';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { PlayerBoardScaler } from './PlayerBoardScaler';
import './Dashboard.css';

export const Dashboard = () => {
  const { currentMatch, players } = useAppSelector((state) => state.match);
  const { heroesData } = useHeroesDataContext();

  // Get valid players (with account_id)
  const validPlayers = React.useMemo(() => {
    if (!players || !Array.isArray(players)) {
      return [];
    }
    return players.filter((player) => {
      if (!player) return false;
      return player.account_id != null && player.account_id !== undefined;
    });
  }, [players]);

  return (
    <AppLayout>
      <MainContentTemplate centered>
        <div className="dashboard">
          {/* Scoreboard Section */}
          <section className="dashboard__section dashboard__section--scoreboard">
            <h2 className="dashboard__section-title">Scoreboard</h2>
            {!currentMatch ? (
              <EmptyState
                title="No Active Match"
                message="Waiting for GSI data from Dota Underlords..."
                showSpinner
              />
            ) : (
              <ScoreboardTable players={players || []} widgetId="scoreboard-default" />
            )}
          </section>

          {/* Player Boards Section */}
          <section className="dashboard__section dashboard__section--player-boards">
            <h2 className="dashboard__section-title">Player Boards</h2>
            {validPlayers.length === 0 ? (
              <div className="dashboard__empty">
                {!currentMatch ? (
                  <>No active match. Waiting for GSI data...</>
                ) : (
                  <>No valid player boards available</>
                )}
              </div>
            ) : (
              <div className="dashboard__player-boards-container">
                <div className="dashboard__player-boards-grid">
                  {validPlayers.map((player) => (
                    <PlayerBoardScaler key={player.account_id}>
                      <PlayerBoard
                        player={player}
                        heroesData={heroesData}
                        onClose={() => {
                          // No-op: Individual boards don't need close functionality in this view
                        }}
                        className="dashboard__player-board"
                      />
                    </PlayerBoardScaler>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Unit Changes Section */}
          <section className="dashboard__section dashboard__section--unit-changes">
            <h2 className="dashboard__section-title">Unit Changes</h2>
            <UnitChanges />
          </section>
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};
