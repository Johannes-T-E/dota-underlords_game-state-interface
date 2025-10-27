import { Text, Badge, Button } from '../../atoms';
import { MatchIdDisplay, DurationDisplay } from '../../molecules';
import { PlacementBoard } from '../PlacementBoard/PlacementBoard';
import type { ApiMatch } from '../../../types';
import './MatchDetailPanel.css';

export interface MatchDetailPanelProps {
  match: ApiMatch;
  onClose: () => void;
  className?: string;
}

export const MatchDetailPanel = ({ match, onClose, className = '' }: MatchDetailPanelProps) => {
  const isComplete = !!match.ended_at;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className={`match-detail-panel ${className}`}>
      <div className="match-detail-panel__header">
        <div>
          <Text variant="h2">Match Details</Text>
          <MatchIdDisplay matchId={match.match_id} label="" />
        </div>
        <Button
          variant="ghost"
          size="small"
          onClick={onClose}
          className="match-detail-panel__close-btn"
          aria-label="Close details"
        >
          ✕
        </Button>
      </div>
      
      {/* Match Info Bar */}
      <div className="match-detail-panel__info">
        <div className="match-detail-panel__info-item">
          <Text variant="label" color="secondary">Status</Text>
          <Badge variant={isComplete ? 'completed' : 'in-progress'}>
            {isComplete ? '✓ Complete' : '⏱ In Progress'}
          </Badge>
        </div>
        <div className="match-detail-panel__info-item">
          <Text variant="label" color="secondary">Players</Text>
          <Text variant="body">{match.player_count}</Text>
        </div>
        <div className="match-detail-panel__info-item">
          <Text variant="label" color="secondary">Started</Text>
          <Text variant="body" className="match-detail-panel__info-value">
            {formatDate(match.started_at)}
          </Text>
        </div>
        {isComplete && (
          <>
            <div className="match-detail-panel__info-item">
              <Text variant="label" color="secondary">Ended</Text>
              <Text variant="body" className="match-detail-panel__info-value">
                {formatDate(match.ended_at!)}
              </Text>
            </div>
            <div className="match-detail-panel__info-item">
              <Text variant="label" color="secondary">Duration</Text>
              <DurationDisplay 
                startTime={match.started_at} 
                endTime={match.ended_at} 
              />
            </div>
          </>
        )}
      </div>

      {/* Players Placement Board */}
      {match.players && match.players.length > 0 && (
        <PlacementBoard players={match.players} />
      )}
    </div>
  );
};

