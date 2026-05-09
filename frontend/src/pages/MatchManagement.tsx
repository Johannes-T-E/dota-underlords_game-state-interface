import { MainContentTemplate } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { IconDatabase } from '@tabler/icons-react';
import { MatchesContainer } from '@/features/match-management';
import './MatchManagement.css';

export const MatchManagement = () => {
  return (
      <MainContentTemplate centered={false} className="match-management-page">
        <div className="match-management-page__container">
          <PageHeader title="Matches" titleIcon="🗂️" icon={<IconDatabase size={18} stroke={1.8} />} />
          <div className="match-management-page__content">
            <MatchesContainer />
          </div>
        </div>
      </MainContentTemplate>
  );
};

