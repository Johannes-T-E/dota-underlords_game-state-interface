import { Text, Spinner, Button } from '../../atoms';
import { MatchesTableRow } from '../MatchesTableRow/MatchesTableRow';
import type { ApiMatch } from '../../../types';
import './MatchesTable.css';

export interface MatchesTableProps {
  matches: ApiMatch[];
  selectedMatchId: string | null;
  loading: boolean;
  error: string | null;
  onMatchSelect: (match: ApiMatch) => void;
  onMatchDelete: (matchId: string) => void;
  onAbandonMatch?: () => void;
  className?: string;
}

export const MatchesTable = ({ 
  matches, 
  selectedMatchId,
  loading,
  error,
  onMatchSelect, 
  onMatchDelete,
  onAbandonMatch,
  className = ''
}: MatchesTableProps) => {
  const hasActiveMatch = matches.some(match => !match.ended_at);

  return (
    <div className={`matches-table-wrapper ${className}`}>
      <div className="matches-table-wrapper__header">
        <Text variant="h3" weight="bold">
          Matches ({matches.length})
        </Text>
        {hasActiveMatch && onAbandonMatch && (
          <Button
            variant="danger"
            size="small"
            onClick={onAbandonMatch}
            title="Abandon current match"
          >
            Abandon Match
          </Button>
        )}
      </div>

      {loading && (
        <div className="matches-table-wrapper__loading">
          <Spinner size="medium" />
          <Text>Loading matches...</Text>
        </div>
      )}

      {error && (
        <div className="matches-table-wrapper__error">
          <Text color="danger">{error}</Text>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="matches-table-wrapper__empty">
          <Text color="secondary">No matches found in database</Text>
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="matches-table-wrapper__content">
          <table className="matches-table">
            <thead>
              <tr>
                <th>Started</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <MatchesTableRow
                  key={match.match_id}
                  match={match}
                  isSelected={selectedMatchId === match.match_id}
                  onClick={() => onMatchSelect(match)}
                  onDelete={onMatchDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

