import React, { useState, useRef, useEffect } from 'react';
import './Tooltip.css';

export interface TooltipProps {
  content: string; // HTML string for tooltip content
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * Tooltip component for displaying ability information on hover
 * Uses absolute positioning with proper z-index handling
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && containerRef.current && tooltipRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let top = 0;
      let left = 0;
      
      switch (position) {
        case 'top':
          top = containerRect.top - tooltipRect.height - 8;
          left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
          // Adjust if tooltip would go off screen
          if (top < 0) {
            top = containerRect.bottom + 8; // Show below instead
          }
          if (left < 0) left = 8;
          if (left + tooltipRect.width > viewportWidth) {
            left = viewportWidth - tooltipRect.width - 8;
          }
          break;
        case 'bottom':
          top = containerRect.bottom + 8;
          left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
          if (top + tooltipRect.height > viewportHeight) {
            top = containerRect.top - tooltipRect.height - 8; // Show above instead
          }
          if (left < 0) left = 8;
          if (left + tooltipRect.width > viewportWidth) {
            left = viewportWidth - tooltipRect.width - 8;
          }
          break;
        case 'left':
          top = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2);
          left = containerRect.left - tooltipRect.width - 8;
          if (left < 0) {
            left = containerRect.right + 8; // Show right instead
          }
          if (top < 0) top = 8;
          if (top + tooltipRect.height > viewportHeight) {
            top = viewportHeight - tooltipRect.height - 8;
          }
          break;
        case 'right':
          top = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2);
          left = containerRect.right + 8;
          if (left + tooltipRect.width > viewportWidth) {
            left = containerRect.left - tooltipRect.width - 8; // Show left instead
          }
          if (top < 0) top = 8;
          if (top + tooltipRect.height > viewportHeight) {
            top = viewportHeight - tooltipRect.height - 8;
          }
          break;
      }
      
      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div
      ref={containerRef}
      className={`ability-tooltip-container ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && content && (
        <div
          ref={tooltipRef}
          className={`ability-tooltip ability-tooltip--${position}`}
          style={
            tooltipPosition
              ? {
                  position: 'fixed',
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                  zIndex: 10000,
                }
              : { visibility: 'hidden' }
          }
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
};

export default Tooltip;

