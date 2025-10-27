import { useEffect } from 'react';
import { useAppDispatch } from '../hooks/redux';
import { setMatches, setMatchesLoading, setMatchesError } from '../store/matchesSlice';
import { apiService } from '../services/api';
import { AppLayout } from '../components/templates';
import { MatchesContainer } from '../features/matches/MatchesContainer';
import { Text } from '../components/atoms';

export const Matches = () => {
  const dispatch = useAppDispatch();

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

  return (
    <AppLayout>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="h1" weight="black">Match Management</Text>
      </div>
      <MatchesContainer />
    </AppLayout>
  );
};

