import React from 'react';
import './Widget.css';

export interface WidgetProps {
  title?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  columnSpan?: number; // how many grid columns to span in dashboard grid
  style?: React.CSSProperties; // optional inline styles (e.g., explicit width)
  resizable?: boolean; // allow user to manually adjust width via drag handle
  minWidth?: number; // px
  maxWidth?: number; // px
  storageKey?: string; // persist width in localStorage
  dragId?: string; // enable header drag handle for reordering
  onHeaderDragStart?: (e: React.DragEvent, id: string) => void;
  onHeaderMouseDown?: (e: React.MouseEvent, id: string) => void; // free placement drag
}

export const Widget = ({ title, headerRight, children, className = '', columnSpan, style, resizable = true, minWidth = 260, maxWidth, storageKey, dragId, onHeaderDragStart, onHeaderMouseDown }: WidgetProps) => {
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(0);
  const pointerDraggingRef = React.useRef(false);
  const pointerOffsetRef = React.useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(`widget:width:${storageKey}`);
      if (saved && sectionRef.current) {
        const val = parseInt(saved, 10);
        if (!Number.isNaN(val)) {
          sectionRef.current.style.width = `${val}px`;
        }
      }
    } catch {}
  }, [storageKey]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = sectionRef.current.getBoundingClientRect().width;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    e.preventDefault();
    e.stopPropagation();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !sectionRef.current) return;
    const dx = e.clientX - startXRef.current;
    let nextWidth = startWidthRef.current + dx;
    if (minWidth) nextWidth = Math.max(minWidth, nextWidth);
    if (maxWidth) nextWidth = Math.min(maxWidth, nextWidth);
    sectionRef.current.style.width = `${Math.round(nextWidth)}px`;
    // Notify children that layout width changed (for components listening to window resize)
    try {
      window.dispatchEvent(new Event('resize'));
    } catch {}
    // Re-measure content height while dragging
    if (bodyRef.current) {
      const el = bodyRef.current;
      const child = el.firstElementChild as HTMLElement | null;
      const rect = (child ? child.getBoundingClientRect() : el.getBoundingClientRect());
      el.style.height = `${Math.round(rect.height)}px`;
    }
  };

  const onMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    if (storageKey && sectionRef.current) {
      try {
        const w = Math.round(sectionRef.current.getBoundingClientRect().width);
        localStorage.setItem(`widget:width:${storageKey}`, String(w));
      } catch {}
    }
  };

  const gridStyle: React.CSSProperties = {
    ...(columnSpan ? { gridColumn: `span ${columnSpan}` } : {}),
    ...style,
  };

  // Auto-fit wrapper height to transformed child content height
  React.useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const setHeight = () => {
      const child = el.firstElementChild as HTMLElement | null;
      const rect = (child ? child.getBoundingClientRect() : el.getBoundingClientRect());
      el.style.height = `${Math.round(rect.height)}px`;
    };
    // Initial measure after paint
    requestAnimationFrame(setHeight);
    // Observe direct content resizes
    const ro = new ResizeObserver(() => setHeight());
    ro.observe(el);
    // Also observe the first child since transforms won't trigger ResizeObserver on parent
    if (el.firstElementChild) {
      ro.observe(el.firstElementChild as Element);
    }
    window.addEventListener('resize', setHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', setHeight);
    };
  }, []);

  return (
    <section ref={sectionRef as any} className={`widget ${resizable ? 'widget--resizable' : ''} ${className}`} style={gridStyle}>
      {(title || headerRight) && (
        <header
          className="widget__header"
          draggable={!!(dragId && onHeaderDragStart)}
          onDragStart={dragId && onHeaderDragStart ? (e) => onHeaderDragStart(e, dragId) : undefined}
          onMouseDown={(e) => {
            if (!dragId) return;
            // Prefer widget-local pointer-based dragging for free placement
            if (onHeaderMouseDown) onHeaderMouseDown(e, dragId);
            // Setup imperative drag for immediate feedback
            const item = (sectionRef.current?.parentElement as HTMLElement) || null;
            const canvas = item?.parentElement?.closest('.dashboard-grid') as HTMLElement | null;
            if (!item || !canvas) return;
            e.preventDefault();
            e.stopPropagation();
            const rect = canvas.getBoundingClientRect();
            const itemRect = item.getBoundingClientRect();
            pointerDraggingRef.current = true;
            pointerOffsetRef.current = { dx: e.clientX - itemRect.left, dy: e.clientY - itemRect.top };
            const onMove = (ev: MouseEvent) => {
              if (!pointerDraggingRef.current) return;
              const x = Math.max(0, ev.clientX - rect.left - pointerOffsetRef.current.dx);
              const y = Math.max(0, ev.clientY - rect.top - pointerOffsetRef.current.dy);
              item.style.left = `${Math.round(x)}px`;
              item.style.top = `${Math.round(y)}px`;
              // Broadcast so Dashboard can persist
              try {
                const event = new CustomEvent('widget:moved', { detail: { id: dragId, x: Math.round(x), y: Math.round(y) } });
                window.dispatchEvent(event);
              } catch {}
            };
            const onUp = () => {
              pointerDraggingRef.current = false;
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        >
          {title && <h3 className="widget__title">{title}</h3>}
          {headerRight && <div className="widget__actions">{headerRight}</div>}
        </header>
      )}
      <div className="widget__body" ref={bodyRef}
      >
        {children}
      </div>
      {resizable && (
        <div className="widget__resize-handle" onMouseDown={onMouseDown} role="separator" aria-orientation="vertical" aria-label="Resize widget" />
      )}
    </section>
  );
};


