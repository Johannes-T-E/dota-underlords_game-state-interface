import { Badge, Button } from '../../atoms';
import { DurationDisplay } from '../../molecules';
import type { ApiMatch } from '../../../types';
import './MatchesTableRow.css';

export interface MatchesTableRowProps {
  match: ApiMatch;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (matchId: string) => void;
  className?: string;
}

export const MatchesTableRow = ({ 
  match, 
  isSelected, 
  onClick, 
  onDelete,
  className = ''
}: MatchesTableRowProps) => {
  const started = new Date(match.started_at);
  const isComplete = !!match.ended_at;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(match.match_id);
  };

  return (
    <tr 
      className={`matches-table-row ${isSelected ? 'matches-table-row--selected' : ''} ${className}`}
      onClick={onClick}
    >
      <td className="matches-table-row__date">
        {started.toLocaleDateString()}
      </td>
      <td className="matches-table-row__duration">
        {isComplete ? (
          <DurationDisplay startTime={match.started_at} endTime={match.ended_at} />
        ) : (
          '—'
        )}
      </td>
      <td className="matches-table-row__status">
        <Badge variant={isComplete ? 'completed' : 'in-progress'}>
          {isComplete ? '✓ Complete' : '⏱ In Progress'}
        </Badge>
      </td>
      <td className="matches-table-row__actions">
        <Button
          variant="danger"
          size="small"
          onClick={handleDeleteClick}
          title="Delete match"
          className="matches-table-row__delete-btn"
        >
          ✕
        </Button>
      </td>
    </tr>
  );
};

