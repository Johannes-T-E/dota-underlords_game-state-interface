import './MatchCountChip.css';

export interface MatchCountChipProps {
  count: number;
  className?: string;
}

export const MatchCountChip = ({ count, className = '' }: MatchCountChipProps) => {
  if (count <= 0) {
    return null;
  }

  return (
    <span className={`match-count-chip ${className}`} title={`Seen in ${count} previous match${count !== 1 ? 'es' : ''}`}>
      {count}
    </span>
  );
};

