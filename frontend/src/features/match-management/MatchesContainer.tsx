import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { removeMatch, setMatches, setMatchesError, setMatchesLoading } from '@/store/matchesSlice';
import { apiService } from '@/services/api';
import { MatchesTable } from './components/MatchesTable/MatchesTable';
import { MatchDetailPanel } from './components/MatchDetailPanel/MatchDetailPanel';
import { EmptyState } from '@/components/shared';
import { SidebarLayoutTemplate } from '@/components/layout';
import type { ApiMatch } from '@/types';

export const MatchesContainer = () => {
  const dispatch = useAppDispatch();
  const { matches, loading, error } = useAppSelector((state) => state.matches);
  const currentMatch = useAppSelector((state) => state.match.currentMatch);
  const [selectedMatch, setSelectedMatch] = useState<ApiMatch | null>(null);
  const lastSyncedActiveMatchId = useRef<string | null>(null);

  const refreshMatches = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      dispatch(setMatchesLoading(true));
    }
    try {
      const data = await apiService.getMatches();
      if (data.status === 'success') {
        dispatch(setMatches(data.matches));
        return data.matches;
      }

      if (!silent) {
        dispatch(setMatchesError('Failed to load matches'));
      }
      return null;
    } catch (err) {
      if (!silent) {
        dispatch(setMatchesError('Failed to load matches'));
      } else {
        console.warn('Silent refresh failed:', err);
      }
      console.error('Failed to load matches:', err);
      return null;
    }
  }, [dispatch]);

  useEffect(() => {
    refreshMatches();
  }, [refreshMatches]);

  useEffect(() => {
    if (!selectedMatch) {
      return;
    }

    const updatedSelectedMatch = matches.find((match) => match.match_id === selectedMatch.match_id);
    if (updatedSelectedMatch) {
      if (updatedSelectedMatch !== selectedMatch) {
        setSelectedMatch(updatedSelectedMatch);
      }
      return;
    }

    setSelectedMatch(null);
  }, [matches, selectedMatch]);

  useEffect(() => {
    const activeMatchId = currentMatch?.match_id ?? null;
    if (!activeMatchId || lastSyncedActiveMatchId.current === activeMatchId) {
      return;
    }

    const alreadyInList = matches.some((match) => match.match_id === activeMatchId);
    if (!alreadyInList) {
      const optimisticMatch: ApiMatch = {
        match_id: activeMatchId,
        started_at: currentMatch?.started_at ?? new Date().toISOString(),
        ended_at: null,
        player_count: currentMatch?.player_count ?? 0,
      };
      dispatch(setMatches([optimisticMatch, ...matches]));
    }

    lastSyncedActiveMatchId.current = activeMatchId;
    void refreshMatches({ silent: true });
  }, [currentMatch, dispatch, matches, refreshMatches]);

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
        const endedAtIso = new Date().toISOString();
        const optimisticMatches = matches.map((match) =>
          match.match_id === response.match_id && !match.ended_at
            ? { ...match, ended_at: endedAtIso }
            : match
        );
        dispatch(setMatches(optimisticMatches));

        if (selectedMatch?.match_id === response.match_id && !selectedMatch.ended_at) {
          setSelectedMatch({ ...selectedMatch, ended_at: endedAtIso });
        }

        void refreshMatches({ silent: true });
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
            borderRadius: 0,
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
            borderRadius: 0
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

