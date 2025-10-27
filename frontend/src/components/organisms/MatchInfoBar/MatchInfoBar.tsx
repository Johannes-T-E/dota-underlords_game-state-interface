import { Button } from '../../atoms';
import { MatchIdDisplay, RoundInfo } from '../../molecules';
import { apiService } from '../../../services/api';
import type { MatchInfo, RoundInfo as RoundInfoType } from '../../../types';
import './MatchInfoBar.css';

export interface MatchInfoBarProps {
  match: MatchInfo;
  currentRound: RoundInfoType;
  onAbandonSuccess?: () => void;
  className?: string;
}

export const MatchInfoBar = ({ 
  match, 
  currentRound, 
  onAbandonSuccess,
  className = '' 
}: MatchInfoBarProps) => {
  const handleAbandonMatch = async () => {
    if (!confirm('Are you sure you want to abandon this match?')) {
      return;
    }

    try {
      const response = await apiService.abandonMatch();
      if (response.status === 'success') {
        console.log('Match abandoned:', response.match_id);
        onAbandonSuccess?.();
      }
    } catch (error) {
      console.error('Error abandoning match:', error);
      alert('Failed to abandon match');
    }
  };

  return (
    <div className={`match-info-bar ${className}`}>
      <div className="match-info-bar__content">
        <MatchIdDisplay matchId={match.match_id} />
        <RoundInfo 
          roundNumber={currentRound.round_number} 
          roundPhase={currentRound.round_phase} 
        />
        <Button
          variant="danger"
          size="medium"
          onClick={handleAbandonMatch}
          className="match-info-bar__abandon-btn"
        >
          Abandon Match
        </Button>
      </div>
    </div>
  );
};

