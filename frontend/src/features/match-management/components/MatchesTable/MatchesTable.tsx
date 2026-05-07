import { Text, Spinner } from '@/components/ui';
import { MatchesTableRow } from '@/features/match-management/components/MatchesTableRow/MatchesTableRow';
import type { ApiMatch } from '@/types';
import './MatchesTable.css';

export interface MatchesTableProps {
  matches: ApiMatch[];
  selectedMatchId: string | null;
  loading: boolean;
  error: string | null;
  onMatchSelect: (match: ApiMatch) => void;
  className?: string;
}

export const MatchesTable = ({ 
  matches, 
  selectedMatchId,
  loading,
  error,
  onMatchSelect, 
  className = ''
}: MatchesTableProps) => {
  return (
    <div className={`matches-table-wrapper ${className}`}>
      <div className="matches-table-wrapper__header">
        <Text variant="h3" weight="bold">
          Matches ({matches.length})
        </Text>
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
                <th>Match</th>
                <th>Player type</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <MatchesTableRow
                  key={match.match_id}
                  match={match}
                  isSelected={selectedMatchId === match.match_id}
                  onClick={() => onMatchSelect(match)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

