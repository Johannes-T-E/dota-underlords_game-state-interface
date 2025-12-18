import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useEffect, useRef, useState } from 'react';
import { AppLayout, MainContentTemplate } from '@/components/layout';
import { PlayerBoard } from '@/features/player-board/components/PlayerBoard/PlayerBoard';
import { EmptyState } from '@/components/shared';
import { PlayerNameDisplay } from '@/components/ui';
import { useAppSelector } from '@/hooks/redux';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import './PlayerBoardPage.css';

export const PlayerBoardPage = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { currentMatch, players } = useAppSelector((state) => state.match);
  const { heroesData } = useHeroesDataContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
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
  
  // Find player by account_id
  const player = useMemo(() => {
    if (!accountId || !validPlayers.length) {
      return null;
    }
    const accountIdNum = parseInt(accountId, 10);
    if (isNaN(accountIdNum)) {
      return null;
    }
    return validPlayers.find((p) => p && p.account_id === accountIdNum) || null;
  }, [accountId, validPlayers]);
  
  // Handle player selection
  const handlePlayerClick = (playerAccountId: number) => {
    navigate(`/player-board/${playerAccountId}`);
  };

  // Calculate scale to fill window
  useEffect(() => {
    if (!player) return;

    const calculateScale = () => {
      if (!containerRef.current || !contentRef.current) return;

      const container = containerRef.current;
      const content = contentRef.current;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const contentWidth = content.scrollWidth;
      const contentHeight = content.scrollHeight;

      // Calculate scale to fit both width and height (allow scaling up)
      const scaleX = containerWidth / contentWidth;
      const scaleY = containerHeight / contentHeight;
      const newScale = Math.min(scaleX, scaleY); // Allow scaling up

      setScale(newScale);
    };

    calculateScale();

    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    window.addEventListener('resize', calculateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateScale);
    };
  }, [player]);

  return (
    <AppLayout>
      <MainContentTemplate className="player-board-page">
        <div style={{ 
          width: '100%', 
          height: '100%',
          minHeight: 'calc(100vh - 2rem)',
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {!currentMatch ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%' 
            }}>
              <EmptyState
                title="No Active Match"
                message="Waiting for GSI data from Dota Underlords..."
                showSpinner
              />
            </div>
          ) : !player ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%' 
            }}>
              <EmptyState
                title="Player Not Found"
                message={`No player found with account ID: ${accountId || 'unknown'}`}
                showSpinner={false}
              />
            </div>
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex',
              flexDirection: 'row',
              overflow: 'hidden'
            }}>
              {/* Player List Sidebar */}
              <div className="player-board-page__sidebar">
                <div className="player-board-page__sidebar-header">Players</div>
                <div className="player-board-page__player-list">
                  {validPlayers.map((p) => {
                    const isSelected = p.account_id === player?.account_id;
                    return (
                      <button
                        key={p.account_id}
                        className={`player-board-page__player-item ${isSelected ? 'player-board-page__player-item--selected' : ''}`}
                        onClick={() => handlePlayerClick(p.account_id)}
                      >
                        <PlayerNameDisplay
                          personaName={p.persona_name}
                          botPersonaName={p.bot_persona_name}
                          matchCount={p.match_count}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Player Board Area */}
              <div
                ref={containerRef}
                className="player-board-page__board-area"
              >
                <div
                  ref={contentRef}
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    width: 'fit-content',
                    height: 'fit-content',
                  }}
                >
                  <PlayerBoard
                    player={player}
                    heroesData={heroesData}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};

