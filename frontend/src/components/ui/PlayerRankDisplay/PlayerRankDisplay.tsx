import { formatRankTierDisplay, getRankPinIconPath } from '@/utils/rankTier';
import './PlayerRankDisplay.css';

export type PlayerRankDisplaySize = 'compact' | 'default';

export interface PlayerRankDisplayProps {
  rankTier?: number | null;
  globalLeaderboardRank?: number | null;
  showText?: boolean;
  size?: PlayerRankDisplaySize;
  className?: string;
}

export function PlayerRankDisplay({
  rankTier,
  globalLeaderboardRank,
  showText = false,
  size = 'default',
  className = '',
}: PlayerRankDisplayProps) {
  const iconPath = getRankPinIconPath(rankTier);
  const label = formatRankTierDisplay(rankTier, globalLeaderboardRank);

  if (!iconPath && !label) return null;

  return (
    <span
      className={`player-rank-display player-rank-display--${size} ${className}`.trim()}
      title={label ?? undefined}
      aria-label={label ?? undefined}
    >
      {iconPath && (
        <img
          className="player-rank-display__icon"
          src={iconPath}
          alt=""
          loading="lazy"
          draggable={false}
        />
      )}
      {showText && label && <span className="player-rank-display__label">{label}</span>}
    </span>
  );
}
