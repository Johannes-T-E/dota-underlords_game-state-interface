import { useAppSelector } from '../../../hooks/redux';
import { apiService } from '../../../services/api';
import './MatchInfo.css';

export const MatchInfo = () => {
  const { currentMatch, currentRound } = useAppSelector((state) => state.match);

  const handleAbandonMatch = async () => {
    if (!confirm('Are you sure you want to abandon this match?')) {
      return;
    }

    try {
      const response = await apiService.abandonMatch();
      if (response.status === 'success') {
        console.log('Match abandoned:', response.match_id);
      }
    } catch (error) {
      console.error('Error abandoning match:', error);
      alert('Failed to abandon match');
    }
  };

  if (!currentMatch) {
    return null;
  }

  return (
    <div id="matchInfo" className="match-info">
      <div className="match-details">
        <span id="matchId">
          Match: <span id="matchIdValue">{currentMatch.match_id}</span>
        </span>
        <span id="roundInfo">
          Round: <span id="roundValue">{currentRound.round_number}</span> (
          <span id="phaseValue">{currentRound.round_phase}</span>)
        </span>
        <button
          id="abandonButton"
          className="abandon-button"
          onClick={handleAbandonMatch}
        >
          Abandon Match
        </button>
      </div>
    </div>
  );
};

