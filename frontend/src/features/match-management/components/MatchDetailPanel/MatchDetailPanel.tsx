import { useEffect, useState } from 'react';
import { Text, Button, MatchIdDisplay, DurationDisplay } from '@/components/ui';
import { PlacementBoard } from '@/features/match-management/components/PlacementBoard/PlacementBoard';
import { apiService } from '@/services/api';
import type { ApiMatch, MatchSummary } from '@/types';
import { getMatchQualitySummary } from '@/features/match-management/utils/matchQuality';
import './MatchDetailPanel.css';

export interface MatchDetailPanelProps {
  match: ApiMatch;
  canAbandonSelected?: boolean;
  onDeleteSelectedMatch?: () => void;
  onAbandonSelectedMatch?: () => void;
  onClose: () => void;
  className?: string;
}

export const MatchDetailPanel = ({
  match,
  canAbandonSelected = false,
  onDeleteSelectedMatch,
  onAbandonSelectedMatch,
  onClose,
  className = ''
}: MatchDetailPanelProps) => {
  const isComplete = !!match.ended_at;
  const statusLabel = isComplete ? 'Complete' : 'In Progress';
  const quality = getMatchQualitySummary(match);
  const [summary, setSummary] = useState<MatchSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    let cancelled = false;
    const loadSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const response = await apiService.getMatchSummary(match.match_id);
        if (!cancelled) {
          setSummary(response.summary);
        }
      } catch (error) {
        if (!cancelled) {
          setSummaryError('Unable to load detailed match summary');
          setSummary(null);
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    };

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [match.match_id]);

  return (
    <div className={`match-detail-panel ${className}`}>
      <div className="match-detail-panel__header">
        <div className="match-detail-panel__header-main">
          <Text variant="h2">Match Details</Text>
          <MatchIdDisplay matchId={match.match_id} label="" />
          <div className="match-detail-panel__header-meta">
            <div className="match-detail-panel__meta-chip">
              <Text variant="label" color="secondary">Status</Text>
              <span className={`match-detail-panel__tag ${isComplete ? 'match-detail-panel__tag--complete' : 'match-detail-panel__tag--progress'}`}>{statusLabel}</span>
            </div>
            <div className="match-detail-panel__meta-chip">
              <Text variant="label" color="secondary">Players</Text>
              <Text variant="body">{match.player_count}</Text>
            </div>
            <div className="match-detail-panel__meta-chip">
              <Text variant="label" color="secondary">Player type</Text>
              <span
                className={`match-detail-panel__tag ${
                  quality.playerType === 'bot'
                    ? 'match-detail-panel__tag--bot'
                    : quality.playerType === 'human'
                      ? 'match-detail-panel__tag--human'
                      : 'match-detail-panel__tag--mixed'
                }`}
              >
                {quality.playerType === 'bot' ? 'Bot' : quality.playerType === 'human' ? 'Human' : 'Mixed'}
              </span>
            </div>
            <div className="match-detail-panel__meta-chip">
              <Text variant="label" color="secondary">Data</Text>
              <span className={`match-detail-panel__tag ${quality.complete ? 'match-detail-panel__tag--complete-data' : 'match-detail-panel__tag--partial-data'}`}>
                {quality.complete ? 'Complete' : 'Partial'}
              </span>
            </div>
            <div className="match-detail-panel__meta-chip">
              <Text variant="label" color="secondary">Started</Text>
              <Text variant="body" className="match-detail-panel__info-value">
                {formatDate(match.started_at)}
              </Text>
            </div>
            {isComplete && (
              <div className="match-detail-panel__meta-chip">
                <Text variant="label" color="secondary">Ended</Text>
                <Text variant="body" className="match-detail-panel__info-value">
                  {formatDate(match.ended_at!)}
                </Text>
              </div>
            )}
            {isComplete && (
              <div className="match-detail-panel__meta-chip">
                <Text variant="label" color="secondary">Duration</Text>
                <DurationDisplay startTime={match.started_at} endTime={match.ended_at} />
              </div>
            )}
            {onAbandonSelectedMatch && (
              <div className="match-detail-panel__meta-chip">
                <Button
                  variant="danger"
                  size="small"
                  onClick={onAbandonSelectedMatch}
                  disabled={!canAbandonSelected}
                  title={canAbandonSelected ? 'Abandon selected in-progress match' : 'Only in-progress selected matches can be abandoned'}
                >
                  Abandon Selected
                </Button>
              </div>
            )}
            {onDeleteSelectedMatch && (
              <div className="match-detail-panel__meta-chip">
                <Button
                  variant="danger"
                  size="small"
                  onClick={onDeleteSelectedMatch}
                  title="Delete selected match"
                >
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
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

      {/* Players Placement Board */}
      {match.players && match.players.length > 0 && (
        <PlacementBoard
          players={match.players}
          summary={summary}
          summaryLoading={summaryLoading}
          summaryError={summaryError}
        />
      )}
    </div>
  );
};

