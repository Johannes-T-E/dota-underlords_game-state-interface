import React from 'react';
import { AppLayout, MainContentTemplate } from '../components/templates';
import { ScoreboardWidget } from '../features/scoreboard/ScoreboardWidget';
import { PlayerBoardWidget } from '../features/PlayerBoardWidget/PlayerBoardWidget';
import { AllPlayerBoardsWidget } from '../features/AllPlayerBoardsWidget/AllPlayerBoardsWidget';
import { useAppSelector } from '../hooks/redux';
import '../components/widgets/WidgetGrid.css';

export const Dashboard = () => {
  const { boardData } = useAppSelector((state) => state.board);
  // Free-placement state (positions persisted)
  type Positions = Record<string, { x: number; y: number }>;
  const [positions, setPositions] = React.useState<Positions>(() => {
    try {
      const saved = localStorage.getItem('dashboard:positions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { scoreboard: { x: 0, y: 0 } };
  });

  const widgetIds = React.useMemo(() => ['scoreboard', 'allPlayerBoards', ...Object.keys(boardData).map((id) => `board:${id}`)], [boardData]);

  // Ensure every widget has a position; cascade new items to the right
  React.useEffect(() => {
    setPositions((prev) => {
      const next = { ...prev } as Positions;
      let cursorX = 0;
      let cursorY = 0;
      widgetIds.forEach((id) => {
        if (!next[id]) {
          next[id] = { x: cursorX, y: cursorY };
          cursorX += 420; // default placement step
          if (cursorX > 1000) { cursorX = 0; cursorY += 320; }
        }
      });
      return next;
    });
  }, [widgetIds]);

  // Persist positions
  React.useEffect(() => {
    try { localStorage.setItem('dashboard:positions', JSON.stringify(positions)); } catch {}
  }, [positions]);

  // Dragging by header for free placement
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const dragOffset = React.useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const canvasRef = React.useRef<HTMLDivElement | null>(null);

  const onHeaderMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(id);
    const pos = positions[id] || { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 } as DOMRect;
    dragOffset.current = { dx: e.clientX - rect.left - pos.x, dy: e.clientY - rect.top - pos.y };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!draggingId) return;
    const { dx, dy } = dragOffset.current;
    const canvas = canvasRef.current;
    const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight } as DOMRect;
    let x = e.clientX - rect.left - dx;
    let y = e.clientY - rect.top - dy;
    // Clamp within canvas
    x = Math.max(0, Math.min(x, rect.width - 50));
    y = Math.max(0, Math.min(y, rect.height - 50));
    setPositions((prev) => ({ ...prev, [draggingId]: { x: Math.round(x), y: Math.round(y) } }));
  };

  const onMouseUp = () => {
    setDraggingId(null);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  // Listen to widget-level imperative move to persist
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: string; x: number; y: number } | undefined;
      if (!detail) return;
      setPositions((prev) => ({ ...prev, [detail.id]: { x: detail.x, y: detail.y } }));
    };
    window.addEventListener('widget:moved', handler as EventListener);
    return () => window.removeEventListener('widget:moved', handler as EventListener);
  }, []);
  return (
    <AppLayout>
      <MainContentTemplate centered>
        <div ref={canvasRef} className="dashboard-grid">
          {widgetIds.map((id) => {
            const pos = positions[id] || { x: 0, y: 0 };
            if (id === 'scoreboard') {
              return (
                <div key={id} className="dashboard-item" style={{ left: pos.x, top: pos.y }}>
                  <ScoreboardWidget storageKey="scoreboard" dragId={id} onHeaderMouseDown={onHeaderMouseDown} />
                </div>
              );
            }
            if (id === 'allPlayerBoards') {
              return (
                <div key={id} className="dashboard-item" style={{ left: pos.x, top: pos.y }}>
                  <AllPlayerBoardsWidget storageKey="allPlayerBoards" dragId={id} onHeaderMouseDown={onHeaderMouseDown} />
                </div>
              );
            }
            if (id.startsWith('board:')) {
              const playerId = id.split(':')[1];
              if (!playerId) return null;
              const player = boardData[playerId];
              if (!player) return null;
              return (
                <div key={id} className="dashboard-item" style={{ left: pos.x, top: pos.y }}>
                  <PlayerBoardWidget player={player} storageKey="board" dragId={id} onHeaderMouseDown={onHeaderMouseDown} />
                </div>
              );
            }
            return null;
          })}
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};


