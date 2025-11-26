import './StarIcon.css';

export type StarRank = 1 | 2 | 3;
export type StarSize = 'small' | 'medium' | 'large';

export interface StarIconProps {
  rank: StarRank;
  size?: StarSize;
  className?: string;
}

export const StarIcon = ({ rank, size = 'medium', className = '' }: StarIconProps) => {
  const clampedRank = Math.min(Math.max(rank, 1), 3) as StarRank;
  const imagePath = `/icons/UI_icons/star_icons/star_rank${clampedRank}_psd.png`;

  return (
    <img
      src={imagePath}
      alt={`${clampedRank} star`}
      className={`star-icon star-icon--${size} star-icon--rank${clampedRank} ${className}`}
    />
  );
};

