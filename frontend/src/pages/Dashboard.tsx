import { useState, useEffect, useMemo } from 'react';
import { AppLayout, MainContentTemplate } from '@/components/layout';
import { ScoreboardTable } from '@/features/scoreboard/components/ScoreboardTable/ScoreboardTable';
import { PlayerBoard } from '@/features/player-board/components/PlayerBoard/PlayerBoard';
/* import { UnitChanges } from '@/features/unit-changes/UnitChanges'; */
import { ShopDisplay } from '@/features/shop';
import { CombatResults } from '@/features/combat-results';
import { EmptyState } from '@/components/shared';
import { Button } from '@/components/ui';
import { OpenInNewTabButton } from '@/components/shared/OpenInNewTabButton';
import { CombatDebugTable } from '@/components/debug/CombatDebugTable';
import { useAppSelector } from '@/hooks/redux';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { PlayerBoardScaler } from './PlayerBoardScaler';
import './Dashboard.css';

export const Dashboard = () => {
  const { currentMatch, players, privatePlayer } = useAppSelector((state) => state.match);
  const { heroesData } = useHeroesDataContext();
  
  // Shared state for unit selection (bidirectional between scoreboard and shop)
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<number>>(new Set());
  
  // Shared state for synergy selection
  const [selectedSynergyKeyword, setSelectedSynergyKeyword] = useState<number | null>(null);
  
  // Debug modal state
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  
  // Keyboard shortcut for debug modal (Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setIsDebugModalOpen((prev) => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Shared handler for unit clicks
  const handleUnitClick = (unitId: number) => {
    // Clear synergy selection when clicking a unit
    setSelectedSynergyKeyword(null);
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
  
  // Shared handler for synergy clicks
  const handleSynergyClick = (keyword: number | null) => {
    // Clear unit selection when clicking a synergy
    setSelectedUnitIds(new Set());
    // Toggle synergy selection: if same keyword clicked, deselect; otherwise select
    setSelectedSynergyKeyword(prev => prev === keyword ? null : keyword);
  };

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

  return (
    <AppLayout>
      <MainContentTemplate centered>
        {/* Debug Toggle Button */}
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100 }}>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsDebugModalOpen(true)}
            title="Open Combat Debug Table (Ctrl+D)"
          >
            Debug Table
          </Button>
        </div>
        
        <div className="dashboard">
          {/* Scoreboard Section */}
          <section className="dashboard__section dashboard__section--scoreboard">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="dashboard__section-title">Scoreboard</h2>
              <OpenInNewTabButton href="/scoreboard" />
            </div>
            {!currentMatch ? (
              <EmptyState
                title="No Active Match"
                message="Waiting for GSI data from Dota Underlords..."
                showSpinner
              />
            ) : (
              <ScoreboardTable 
                players={players || []} 
                widgetId="scoreboard-default"
                selectedUnitIds={selectedUnitIds}
                onUnitClick={handleUnitClick}
                selectedSynergyKeyword={selectedSynergyKeyword}
                onSynergyClick={handleSynergyClick}
              />
            )}
          </section>

          {/* Shop Section */}
          <section className="dashboard__section dashboard__section--shop">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="dashboard__section-title">Shop</h2>
              <OpenInNewTabButton href="/shop" />
            </div>
            {!currentMatch ? (
              <EmptyState
                title="No Active Match"
                message="Waiting for GSI data from Dota Underlords..."
                showSpinner
              />
            ) : (
              <ShopDisplay
                privatePlayer={privatePlayer}
                players={players || []}
                heroesData={heroesData}
                selectedUnitIds={selectedUnitIds}
                onUnitClick={handleUnitClick}
              />
            )}
          </section>

          {/* Player Boards Section */}
          <section className="dashboard__section dashboard__section--player-boards">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="dashboard__section-title">Player Boards</h2>
              <OpenInNewTabButton href="/player-boards" />
            </div>
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
            {/* <UnitChanges /> */}
          </section>

          {/* Combat Results Section */}
          <section className="dashboard__section dashboard__section--combat-results">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="dashboard__section-title">Combat Results</h2>
              <OpenInNewTabButton href="/combat-results" />
            </div>
            <CombatResults />
          </section>

          {/* Hero Pool Stats Section */}
          <section className="dashboard__section dashboard__section--hero-pool-stats">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="dashboard__section-title">Hero Pool Stats</h2>
              <OpenInNewTabButton href="/hero-pool-stats" />
            </div>
            {!currentMatch ? (
              <EmptyState
                title="No Active Match"
                message="Waiting for GSI data from Dota Underlords..."
                showSpinner
              />
            ) : (
              <div style={{ padding: '16px', minHeight: '300px' }}>
                <p style={{ color: 'var(--text-secondary, #b9bbbe)', fontSize: '14px' }}>
                  View detailed hero pool statistics by synergy on the dedicated page.
                </p>
              </div>
            )}
          </section>
        </div>
        
        {/* Combat Debug Table Modal */}
        <CombatDebugTable
          isOpen={isDebugModalOpen}
          onClose={() => setIsDebugModalOpen(false)}
        />
      </MainContentTemplate>
    </AppLayout>
  );
};
