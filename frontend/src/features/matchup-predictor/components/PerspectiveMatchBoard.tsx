import { useEffect, useMemo, useRef, useState } from 'react';
import {
  GoldDisplay,
  HealthDisplay,
  LevelXpIndicator,
  PlayerNameDisplay,
  StreakBadge,
  SynergiesCell,
  Text,
} from '@/components/ui';
import { PlayerBoard } from '@/features/player-board';
import type { PlayerState } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import './PerspectiveMatchBoard.css';

interface PerspectiveMatchBoardProps {
  perspectivePlayer?: PlayerState;
  opponentPlayer?: PlayerState;
  perspectivePlacement?: number;
  opponentPlacement?: number;
  showBench?: boolean;
  heroesData: HeroesData | null;
}

const BOARD_BASE_WIDTH = 704;
const BOARD_CONTENT_HEIGHT_WITH_BENCH = 456;
const BOARD_CONTENT_HEIGHT_NO_BENCH = 368;

const PlayerSummaryBar = ({
  player,
  side,
  placement,
}: {
  player?: PlayerState;
  side: 'top' | 'bottom';
  placement?: number;
}) => (
  <div className={`perspective-match-board__summary perspective-match-board__summary--${side}`}>
    {player ? (
      <>
        <div className="perspective-match-board__slot">
          #{placement ?? '?'}
        </div>
        <div className="perspective-match-board__player">
          <PlayerNameDisplay
            personaName={player.persona_name}
            botPersonaName={player.bot_persona_name}
            matchCount={player.match_count}
          />
        </div>
        <div className="perspective-match-board__level">
          <LevelXpIndicator
            level={player.level || 0}
            xp={player.xp || 0}
            nextLevelXp={player.next_level_xp || 1}
            showXpText={false}
          />
        </div>
        <div className="perspective-match-board__gold">
          <GoldDisplay gold={player.gold || 0} />
        </div>
        <div className="perspective-match-board__streak">
          <StreakBadge winStreak={player.win_streak || 0} loseStreak={player.lose_streak || 0} />
        </div>
        <div className="perspective-match-board__health">
          <HealthDisplay health={player.health || 0} />
        </div>
        <div className="perspective-match-board__synergies">
          <SynergiesCell
            synergies={player.synergies || []}
            showPips
            compactPipWidthByTierCount
            onlyActive
            maxDisplay={6}
          />
        </div>
      </>
    ) : (
      <Text variant="body" color="secondary">No opponent board</Text>
    )}
  </div>
);

const buildOpponentPerspectivePlayer = (opponentPlayer?: PlayerState): PlayerState | undefined => {
  if (!opponentPlayer) return undefined;

  return {
    ...opponentPlayer,
    units: (opponentPlayer.units || [])
      .filter((unit) => unit.position)
      .map((unit) => ({
        ...unit,
        position: unit.position.y === -1
          ? { ...unit.position, x: 7 - unit.position.x }
          : { ...unit.position, x: 7 - unit.position.x, y: 3 - unit.position.y },
      })),
  };
};

export const PerspectiveMatchBoard = ({
  perspectivePlayer,
  opponentPlayer,
  perspectivePlacement,
  opponentPlacement,
  showBench = true,
  heroesData,
}: PerspectiveMatchBoardProps) => {
  const stackRef = useRef<HTMLDivElement>(null);
  const [boardScale, setBoardScale] = useState(1);
  const transformedOpponent = useMemo(
    () => buildOpponentPerspectivePlayer(opponentPlayer),
    [opponentPlayer]
  );

  useEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;

    const updateScale = () => {
      const availableWidth = stack.clientWidth;
      const availableHeight = stack.clientHeight;
      const widthScale = availableWidth > 0 ? availableWidth / BOARD_BASE_WIDTH : 1;
      // Stack layout always reserves two board zones (opponent + perspective),
      // even when opponent is empty and shown as skeleton.
      const boardCount = perspectivePlayer ? 2 : 1;

      const topSummaryEl = stack.querySelector('.perspective-match-board__summary--top') as HTMLElement | null;
      const dividerEl = stack.querySelector('.perspective-match-board__divider') as HTMLElement | null;
      const bottomSummaryEl = stack.querySelector('.perspective-match-board__summary--bottom') as HTMLElement | null;

      const reservedHeight =
        (topSummaryEl?.offsetHeight ?? 0) +
        (dividerEl?.offsetHeight ?? 0) +
        (bottomSummaryEl?.offsetHeight ?? 0);

      const availableForBoards = Math.max(availableHeight - reservedHeight, 1);
      const perBoardAvailableHeight = availableForBoards / Math.max(boardCount, 1);
      const boardContentHeight = showBench ? BOARD_CONTENT_HEIGHT_WITH_BENCH : BOARD_CONTENT_HEIGHT_NO_BENCH;
      const heightScale = perBoardAvailableHeight / boardContentHeight;

      setBoardScale(Math.max(0.5, Math.min(widthScale, heightScale)));
    };

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(stack);

    return () => resizeObserver.disconnect();
  }, [perspectivePlayer, transformedOpponent, showBench]);

  return (
    <section className="perspective-match-board">
      <div ref={stackRef} className="perspective-match-board__stack" aria-label="Predicted matchup board">
        <PlayerSummaryBar player={opponentPlayer} side="top" placement={opponentPlacement} />

        {transformedOpponent ? (
          <PlayerBoard
            player={transformedOpponent}
            heroesData={heroesData}
            className="perspective-match-board__board perspective-match-board__board--opponent"
            displayScale={boardScale}
            benchPosition="top"
            showBench={showBench}
          />
        ) : (
          <div
            className="perspective-match-board__empty-board"
            aria-label="No opponent board"
            style={{ zoom: boardScale, transformOrigin: 'top left' }}
          >
            <div className="perspective-match-board__empty-grid">
              {showBench && (
                <div className="perspective-match-board__empty-bench">
                  {Array.from({ length: 8 }, (_, index) => (
                    <div key={`empty-bench-${index}`} className="perspective-match-board__empty-cell" />
                  ))}
                </div>
              )}
              <div className="perspective-match-board__empty-roster">
                {Array.from({ length: 32 }, (_, index) => (
                  <div key={`empty-roster-${index}`} className="perspective-match-board__empty-cell" />
                ))}
              </div>
            </div>
            <div className="perspective-match-board__empty-overlay">
              <Text variant="body" color="secondary">No opponent board</Text>
            </div>
          </div>
        )}

        {perspectivePlayer && (
          <>
            <div className="perspective-match-board__divider" aria-hidden="true" />
            <PlayerBoard
              player={perspectivePlayer}
              heroesData={heroesData}
              className="perspective-match-board__board perspective-match-board__board--perspective"
              displayScale={boardScale}
              showBench={showBench}
            />
            <PlayerSummaryBar player={perspectivePlayer} side="bottom" placement={perspectivePlacement} />
          </>
        )}
      </div>
    </section>
  );
};
