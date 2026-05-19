import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import './HoverTooltip.css';

const VIEWPORT_PADDING = 8;
const DEFAULT_CURSOR_OFFSET = { x: 14, y: 14 };

export interface HoverTooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom';
  disabled?: boolean;
  className?: string;
  showDelayMs?: number;
  hideDelayMs?: number;
  /** Position near the pointer instead of anchoring to the trigger element */
  followCursor?: boolean;
  cursorOffset?: { x: number; y: number };
}

function clampPosition(
  left: number,
  top: number,
  width: number,
  height: number
): { top: number; left: number } {
  const maxLeft = window.innerWidth - width - VIEWPORT_PADDING;
  const maxTop = window.innerHeight - height - VIEWPORT_PADDING;

  return {
    left: Math.min(Math.max(left, VIEWPORT_PADDING), Math.max(VIEWPORT_PADDING, maxLeft)),
    top: Math.min(Math.max(top, VIEWPORT_PADDING), Math.max(VIEWPORT_PADDING, maxTop)),
  };
}

export const HoverTooltip = ({
  content,
  children,
  placement = 'top',
  disabled = false,
  className = '',
  showDelayMs = 120,
  hideDelayMs = 80,
  followCursor = false,
  cursorOffset = DEFAULT_CURSOR_OFFSET,
}: HoverTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const updateCursorPos = useCallback((event: MouseEvent) => {
    setCursorPos({ x: event.clientX, y: event.clientY });
  }, []);

  const positionFromElement = useCallback(() => {
    if (!containerRef.current || !tooltipRef.current) {
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 8;

    let top =
      placement === 'top'
        ? containerRect.top - tooltipRect.height - gap
        : containerRect.bottom + gap;
    let left =
      containerRect.left + containerRect.width / 2 - tooltipRect.width / 2;

    if (placement === 'top' && top < VIEWPORT_PADDING) {
      top = containerRect.bottom + gap;
    } else if (
      placement === 'bottom' &&
      top + tooltipRect.height > window.innerHeight - VIEWPORT_PADDING
    ) {
      top = containerRect.top - tooltipRect.height - gap;
    }

    setTooltipPosition(
      clampPosition(left, top, tooltipRect.width, tooltipRect.height)
    );
  }, [placement]);

  const positionFromCursor = useCallback(() => {
    if (!tooltipRef.current || !cursorPos) {
      return;
    }

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    let left = cursorPos.x + cursorOffset.x;
    let top = cursorPos.y + cursorOffset.y;

    if (left + tooltipRect.width > window.innerWidth - VIEWPORT_PADDING) {
      left = cursorPos.x - tooltipRect.width - cursorOffset.x;
    }
    if (top + tooltipRect.height > window.innerHeight - VIEWPORT_PADDING) {
      top = cursorPos.y - tooltipRect.height - cursorOffset.y;
    }

    setTooltipPosition(
      clampPosition(left, top, tooltipRect.width, tooltipRect.height)
    );
  }, [cursorPos, cursorOffset.x, cursorOffset.y]);

  useLayoutEffect(() => {
    if (!isVisible || !tooltipRef.current) {
      return;
    }

    if (followCursor) {
      positionFromCursor();
    } else {
      positionFromElement();
    }
  }, [
    isVisible,
    followCursor,
    cursorPos,
    content,
    placement,
    positionFromCursor,
    positionFromElement,
  ]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const handleMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    updateCursorPos(event);
    clearTimers();
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, showDelayMs);
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    updateCursorPos(event);
  };

  const handleMouseLeave = () => {
    clearTimers();
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setTooltipPosition(null);
      setCursorPos(null);
    }, hideDelayMs);
  };

  const fallbackPosition =
    cursorPos != null
      ? {
          top: cursorPos.y + cursorOffset.y,
          left: cursorPos.x + cursorOffset.x,
        }
      : { top: 0, left: 0 };

  const resolvedPosition = tooltipPosition ?? fallbackPosition;

  const tooltipNode =
    isVisible && content && !disabled ? (
      <div
        ref={tooltipRef}
        className={`hover-tooltip hover-tooltip--${placement} ${className}`}
        style={{
          position: 'fixed',
          top: `${resolvedPosition.top}px`,
          left: `${resolvedPosition.left}px`,
        }}
        role="tooltip"
      >
        {content}
      </div>
    ) : null;

  return (
    <div
      ref={containerRef}
      className="hover-tooltip-container"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {tooltipNode && createPortal(tooltipNode, document.body)}
    </div>
  );
};
