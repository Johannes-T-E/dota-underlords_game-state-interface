import { AppLayout, MainContentTemplate } from '@/components/layout';
import { MatchesContainer } from '@/features/match-management';
import './MatchManagement.css';

export const MatchManagement = () => {
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

