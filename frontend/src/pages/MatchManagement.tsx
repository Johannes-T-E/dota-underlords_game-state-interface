import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { setMatches, setMatchesLoading, setMatchesError } from '@/store/matchesSlice';
import { apiService } from '@/services/api';
import { AppLayout, MainContentTemplate } from '@/components/layout';
import { MatchesContainer } from '@/features/match-management';
import './MatchManagement.css';

export const MatchManagement = () => {
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
      <MainContentTemplate centered={false} className="match-management-page">
        <div className="match-management-page__container">
          <div className="match-management-page__header">
            <h1 className="match-management-page__title">Match Management</h1>
          </div>
          <div className="match-management-page__content">
            <MatchesContainer />
          </div>
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};

