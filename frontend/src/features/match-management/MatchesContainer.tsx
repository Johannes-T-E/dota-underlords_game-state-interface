import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { removeMatch } from '@/store/matchesSlice';
import { apiService } from '@/services/api';
import { MatchesTable } from './components/MatchesTable/MatchesTable';
import { MatchDetailPanel } from './components/MatchDetailPanel/MatchDetailPanel';
import { EmptyState } from '@/components/shared';
import { SidebarLayoutTemplate } from '@/components/layout';
import type { ApiMatch } from '@/types';

export const MatchesContainer = () => {
  const dispatch = useAppDispatch();
  const { matches, loading, error } = useAppSelector((state) => state.matches);
  const [selectedMatch, setSelectedMatch] = useState<ApiMatch | null>(null);

  const handleMatchSelect = (match: ApiMatch) => {
    if (selectedMatch?.match_id === match.match_id) {
      setSelectedMatch(null);
    } else {
      setSelectedMatch(match);
    }
  };

  const handleMatchDelete = async (matchId: string) => {
    const confirmMessage = `Are you sure you want to delete match ${matchId}?\n\nThis will permanently remove:\n- Match record\n- All player data\n- All snapshots\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const data = await apiService.deleteMatch(matchId);
      if (data.status === 'success') {
        console.log('Match deleted:', matchId);
        dispatch(removeMatch(matchId));
        if (selectedMatch?.match_id === matchId) {
          setSelectedMatch(null);
        }
      } else {
        alert('Failed to delete match: ' + data.message);
      }
    } catch (err) {
      console.error('Error deleting match:', err);
      alert('Failed to delete match');
    }
  };

  const handleCloseDetails = () => {
    setSelectedMatch(null);
  };

  const handleAbandonMatch = async () => {
    if (!confirm('Are you sure you want to abandon the current match? This will end the active match.')) {
      return;
    }

    try {
      const response = await apiService.abandonMatch();
      if (response.status === 'success') {
        console.log('Match abandoned:', response.match_id);
        alert('Match abandoned successfully');
      }
    } catch (error) {
      console.error('Error abandoning match:', error);
      alert('Failed to abandon match');
    }
  };

  return (
    <SidebarLayoutTemplate
      sidebar={
        <MatchesTable
          matches={matches}
          selectedMatchId={selectedMatch?.match_id || null}
          loading={loading}
          error={error}
          onMatchSelect={handleMatchSelect}
          onMatchDelete={handleMatchDelete}
          onAbandonMatch={handleAbandonMatch}
        />
      }
      main={
        selectedMatch ? (
          <div style={{ 
            background: 'var(--secondary-color)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <MatchDetailPanel
              match={selectedMatch}
              onClose={handleCloseDetails}
            />
          </div>
        ) : (
          <div style={{ 
            background: 'var(--secondary-color)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px'
          }}>
            <EmptyState
              title="Select a match to view details"
              message="Choose a match from the list to see player information and final standings."
            />
          </div>
        )
      }
    />
  );
};

