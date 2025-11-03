import React from 'react';
import { Widget } from '../../components/widgets/Widget';
import { Button, Text } from '../../components/atoms';
import { PlayerBoard } from '../../components/organisms/PlayerBoard/PlayerBoard';
import { useHeroesData } from '../../hooks/useHeroesData';
import { useAppDispatch } from '../../hooks/redux';
import { removePlayerBoard } from '../../store/boardSlice';
import type { PlayerState } from '../../types';

export interface PlayerBoardWidgetProps {
  player: PlayerState;
  storageKey?: string;
  dragId?: string;
  onHeaderDragStart?: (e: React.DragEvent, id: string) => void;
  onHeaderMouseDown?: (e: React.MouseEvent, id: string) => void;
}

export const PlayerBoardWidget = ({ player, storageKey, dragId, onHeaderDragStart, onHeaderMouseDown }: PlayerBoardWidgetProps) => {
  const dispatch = useAppDispatch();
  const { heroesData } = useHeroesData();
  const outerRef = React.useRef<HTMLDivElement | null>(null);
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = React.useState(1);
  const [scaledHeight, setScaledHeight] = React.useState<number | undefined>(undefined);

  const playerName = player.persona_name || player.bot_persona_name || 'Unknown';

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
    <Widget
      title={<Text variant="body" weight="bold">{`${playerName}`}</Text> as unknown as string}
      storageKey={storageKey ? `${storageKey}:${player.player_id}` : undefined}
      dragId={dragId}
      onHeaderDragStart={onHeaderDragStart}
      onHeaderMouseDown={onHeaderMouseDown}
      headerRight={
        <Button
          variant="ghost"
          size="small"
          aria-label="Close board"
          title="Close"
          onClick={() => dispatch(removePlayerBoard(player.player_id))}
        >
          ×
        </Button>
      }
    >
      <div ref={outerRef} style={{ width: '100%' }}>
        <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top left', height: scaledHeight }}>
          <PlayerBoard
            player={player}
            heroesData={heroesData}
            onClose={() => dispatch(removePlayerBoard(player.player_id))}
          />
        </div>
      </div>
    </Widget>
  );
};


