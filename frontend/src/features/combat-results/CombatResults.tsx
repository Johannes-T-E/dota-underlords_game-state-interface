import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { apiService } from '@/services/api';
import { setCombatHistory } from '@/store/matchSlice';
import { CombatResultsTable } from './components/CombatResultsTable/CombatResultsTable';
import { EmptyState } from '@/components/shared';

export const CombatResults = () => {
  const dispatch = useAppDispatch();
  const { currentMatch, players, combatHistory } = useAppSelector((state) => state.match);

  // Fetch combat history on mount or when match changes
  useEffect(() => {
    if (currentMatch?.match_id) {
      const fetchHistory = async () => {
        try {
          const history = await apiService.fetchCombatHistory(currentMatch.match_id);
          dispatch(setCombatHistory(history));
        } catch (error) {
          console.error('Failed to fetch combat history:', error);
          // Don't show error to user, just log it
          // Combat results will come via WebSocket anyway
        }
      };
      
      fetchHistory();
    }
  }, [currentMatch?.match_id, dispatch]);

  if (!currentMatch) {
    return (
      <EmptyState
        title="No Active Match"
        message="Waiting for GSI data from Dota Underlords..."
        showSpinner
      />
    );
  }

  const hasAnyCombats = Object.keys(combatHistory).length > 0;

  return (
    <div className="combat-results">
      {!hasAnyCombats ? (
        <EmptyState
          title="No Combat Results Yet"
          message="Combat results will appear here as matches complete."
        />
      ) : (
        <CombatResultsTable
          combatHistory={combatHistory}
          players={players || []}
        />
      )}
    </div>
  );
};

