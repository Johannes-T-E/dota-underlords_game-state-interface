import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { IconRepeat } from '@tabler/icons-react';
import { Button } from '@/components/ui';
import { PlayerBoard } from '@/features/player-board';
import { MovementTrail } from '@/features/player-board/components/PlayerBoard/components/MovementTrail/MovementTrail';
import { CELL_SIZE, GAP_SIZE } from '@/features/player-board/utils/positionUtils';
import { useUnitAnimationSettings } from '@/hooks/useSettings';
import { getHeroTier } from '@/utils/heroHelpers';
import type { PlayerState } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import './UnitAnimationBoardPreview.css';

const PREVIEW_ACCOUNT_ID = -9001;
const PREVIEW_ENTINDEX = 9001;
const PREVIEW_UNIT_ID = 6;
const START_COL = 0;
const END_COL = 7;
const PREVIEW_ROW = 0;
const DISPLAY_SCALE = 0.82;

const BASE_PREVIEW_PLAYER: PlayerState = {
  account_id: PREVIEW_ACCOUNT_ID,
  persona_name: 'Preview',
  player_slot: 0,
  is_human_player: true,
  health: 100,
  gold: 0,
  level: 1,
  xp: 0,
  next_level_xp: 1,
  wins: 0,
  losses: 0,
  win_streak: 0,
  lose_streak: 0,
  net_worth: 0,
  final_place: 0,
  combat_type: 0,
  combat_result: 0,
  combat_duration: 0,
  board_unit_limit: 8,
  units: [],
  item_slots: [],
  synergies: [],
  underlord: 0,
  underlord_selected_talents: [],
  event_tier: 0,
  owns_event: false,
  is_mirrored_match: false,
  connection_status: 0,
  disconnected_time: 0,
  vs_opponent_wins: 0,
  vs_opponent_losses: 0,
  vs_opponent_draws: 0,
  brawny_kills_float: 0,
  city_prestige_level: 0,
  platform: 0,
  board_buddy: {},
  lobby_team: 0,
  sequence_number: 0,
  timestamp: '',
  round_number: 1,
  round_phase: 'prep',
};

const createPreviewPlayer = (col: number): PlayerState => ({
  ...BASE_PREVIEW_PLAYER,
  units: [
    {
      entindex: PREVIEW_ENTINDEX,
      unit_id: PREVIEW_UNIT_ID,
      rank: 1,
      position: { x: col, y: PREVIEW_ROW },
    },
  ],
});

export interface UnitAnimationBoardPreviewProps {
  heroesData: HeroesData | null;
}

export const UnitAnimationBoardPreview = ({
  heroesData,
}: UnitAnimationBoardPreviewProps) => {
  const { settings: animationSettings } = useUnitAnimationSettings();
  const [unitCol, setUnitCol] = useState(START_COL);
  const [instantPosition, setInstantPosition] = useState(false);
  const [persistentTrailVisible, setPersistentTrailVisible] = useState(false);
  const playIdRef = useRef(0);
  const prevDurationRef = useRef(animationSettings.animationDuration);
  const prevMotionEnabledRef = useRef(animationSettings.enablePositionAnimation);

  const previewPlayer = useMemo(
    () => createPreviewPlayer(unitCol),
    [unitCol],
  );

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const canAnimate =
    animationSettings.enablePositionAnimation && !prefersReducedMotion;

  const showMovementTrail =
    canAnimate && (animationSettings.enableMovementTrail ?? true);

  const replayAnimation = useCallback(() => {
    if (!canAnimate) {
      setInstantPosition(false);
      setUnitCol(START_COL);
      setPersistentTrailVisible(false);
      return;
    }

    const playId = ++playIdRef.current;

    // Snap to start instantly, then animate to end (avoids React batching 0→7 in one frame).
    flushSync(() => {
      setInstantPosition(true);
      setUnitCol(START_COL);
      setPersistentTrailVisible(false);
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (playId !== playIdRef.current) return;
        setInstantPosition(false);
        setUnitCol(END_COL);
      });
    });
  }, [canAnimate]);

  // Replay when speed or motion toggles change — not on every trail tweak (that breaks slider drag).
  useEffect(() => {
    const duration = animationSettings.animationDuration;
    const motionEnabled = animationSettings.enablePositionAnimation;
    const durationChanged = prevDurationRef.current !== duration;
    const motionChanged = prevMotionEnabledRef.current !== motionEnabled;

    prevDurationRef.current = duration;
    prevMotionEnabledRef.current = motionEnabled;

    if (!durationChanged && !motionChanged) {
      return;
    }

    replayAnimation();
  }, [
    animationSettings.animationDuration,
    animationSettings.enablePositionAnimation,
    replayAnimation,
  ]);

  useEffect(() => {
    if (canAnimate) return;
    setInstantPosition(false);
    setUnitCol(START_COL);
    setPersistentTrailVisible(false);
  }, [canAnimate]);

  // Keep a static trail visible after the unit finishes moving (PlayerBoard clears its own).
  useEffect(() => {
    if (!showMovementTrail || instantPosition || unitCol !== END_COL) {
      setPersistentTrailVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setPersistentTrailVisible(true);
    }, animationSettings.animationDuration);

    return () => window.clearTimeout(timer);
  }, [
    showMovementTrail,
    instantPosition,
    unitCol,
    animationSettings.animationDuration,
  ]);

  const unitTier = animationSettings.useTierColor
    ? getHeroTier(PREVIEW_UNIT_ID, heroesData)
    : undefined;

  return (
    <div className="unit-animation-board-preview">
      <div className="unit-animation-board-preview__toolbar">
        <Button
          type="button"
          variant="secondary"
          size="small"
          className="unit-animation-board-preview__replay"
          disabled={!canAnimate}
          onClick={(e) => {
            e.stopPropagation();
            replayAnimation();
          }}
          aria-label="Replay movement animation"
          title="Replay"
        >
          <IconRepeat size={16} stroke={1.75} aria-hidden />
        </Button>
      </div>

      <div className="unit-animation-board-preview__board-wrap">
        <PlayerBoard
          player={previewPlayer}
          heroesData={heroesData}
          showBench
          displayScale={DISPLAY_SCALE}
          instantPosition={instantPosition}
          className="unit-animation-board-preview__board"
        />

        {persistentTrailVisible && showMovementTrail && (
          <div className="unit-animation-board-preview__trail-overlay" aria-hidden>
            <div
              className="player-board player-board--bench-bottom unit-animation-board-preview__trail-shell"
              style={{ zoom: DISPLAY_SCALE, transformOrigin: 'top left' }}
            >
              <div className="player-board__grid-container">
                <MovementTrail
                  persist
                  fromPosition={{ x: START_COL, y: PREVIEW_ROW }}
                  toPosition={{ x: END_COL, y: PREVIEW_ROW }}
                  duration={animationSettings.animationDuration}
                  trailLength={1}
                  cellSize={CELL_SIZE}
                  gapSize={GAP_SIZE}
                  trailColor={animationSettings.trailColor}
                  trailOpacity={animationSettings.trailOpacity}
                  trailThickness={animationSettings.trailThickness}
                  useTierColor={animationSettings.useTierColor}
                  unitTier={unitTier}
                  showBench
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
