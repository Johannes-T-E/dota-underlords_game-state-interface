import { DurationDisplay } from '@/components/ui';
import type { ApiMatch } from '@/types';
import { getMatchQualitySummary } from '@/features/match-management/utils/matchQuality';
import './MatchesTableRow.css';

export interface MatchesTableRowProps {
  match: ApiMatch;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export const MatchesTableRow = ({ 
  match, 
  isSelected, 
  onClick, 
  className = ''
}: MatchesTableRowProps) => {
  const started = new Date(match.started_at);
  const isComplete = !!match.ended_at;
  const quality = getMatchQualitySummary(match);

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
      <td className={`matches-table-row__status ${isComplete ? 'matches-table-row__status--complete' : 'matches-table-row__status--progress'}`}>
        <span className={`matches-table-row__value-tag ${isComplete ? 'matches-table-row__value-tag--complete' : 'matches-table-row__value-tag--progress'}`}>
          {isComplete ? 'Complete' : 'In Progress'}
        </span>
      </td>
      <td
        className={`matches-table-row__bots ${
          quality.playerType === 'bot'
            ? 'matches-table-row__bots--heavy'
            : quality.playerType === 'human'
              ? 'matches-table-row__bots--human'
              : ''
        }`}
      >
        <span className={`matches-table-row__value-tag ${
          quality.playerType === 'bot'
            ? 'matches-table-row__value-tag--bot'
            : quality.playerType === 'human'
              ? 'matches-table-row__value-tag--human'
              : 'matches-table-row__value-tag--mixed'
        }`}>
          {quality.playerType === 'bot' ? 'Bot' : quality.playerType === 'human' ? 'Human' : 'Mixed'}
        </span>
      </td>
      <td className={`matches-table-row__data ${quality.complete ? 'matches-table-row__data--complete' : 'matches-table-row__data--partial'}`}>
        <span className={`matches-table-row__value-tag ${quality.complete ? 'matches-table-row__value-tag--complete-data' : 'matches-table-row__value-tag--partial-data'}`}>
          {quality.complete ? 'Complete' : 'Partial'}
        </span>
      </td>
    </tr>
  );
};

