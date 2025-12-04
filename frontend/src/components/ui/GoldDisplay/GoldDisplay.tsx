import { memo } from 'react';
import './GoldDisplay.css';

export interface GoldDisplayProps {
  gold: number | null;
  className?: string;
}

export const GoldDisplay = memo(({ gold, className = '' }: GoldDisplayProps) => {
  return (
    <div className={`gold-display ${className}`}>
      <div className="gold-display__value">
        {gold !== null ? gold : '—'}
      </div>
      <div className="gold-display__icon">
      ●
      </div>
    </div>
  );
});

GoldDisplay.displayName = 'GoldDisplay';
