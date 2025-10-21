import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  setMatches,
  setMatchesLoading,
  setMatchesError,
  removeMatch,
} from '../store/matchesSlice';
import { apiService } from '../services/api';
import '../styles/scoreboard.css';
import '../styles/matches.css';

export const Matches = () => {
  const dispatch = useAppDispatch();
  const { matches, loading, error } = useAppSelector((state) => state.matches);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    dispatch(setMatchesLoading(true));
    try {
      const data = await apiService.getMatches();
      if (data.status === 'success') {
        dispatch(setMatches(data.matches));
      }
    } catch (err) {
      dispatch(setMatchesError('Failed to load matches'));
      console.error('Failed to load matches:', err);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    const confirmMessage = `Are you sure you want to delete match ${matchId}?\n\nThis will permanently remove:\n- Match record\n- All player data\n- All snapshots\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const data = await apiService.deleteMatch(matchId);
      if (data.status === 'success') {
        console.log('Match deleted:', matchId);
        dispatch(removeMatch(matchId));
      } else {
        alert('Failed to delete match: ' + data.message);
      }
    } catch (err) {
      console.error('Error deleting match:', err);
      alert('Failed to delete match');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container">
      <h1>Match Management</h1>

      <div className="navigation">
        <Link to="/scoreboard" className="nav-button">
          ← Back to Scoreboard
        </Link>
      </div>

      <div id="matchesList" className="matches-list">
        {loading && <div className="loading">Loading matches...</div>}

        {error && <div className="empty-state">{error}</div>}

        {!loading && !error && matches.length === 0 && (
          <div className="empty-state">No matches found in database</div>
        )}

        {!loading &&
          !error &&
          matches.length > 0 &&
          matches.map((match) => (
            <div className="match-item" key={match.match_id} data-match-id={match.match_id}>
              <div className="match-info">
                <div className="match-id">Match ID: {match.match_id}</div>
                <div className="match-meta">
                  Started: {formatDate(match.started_at)} |
                  Ended: {match.ended_at ? formatDate(match.ended_at) : 'In Progress'} |
                  Players: {match.player_count}
                </div>
              </div>
              <button
                className="delete-button"
                onClick={() => handleDeleteMatch(match.match_id)}
              >
                Delete Match
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

