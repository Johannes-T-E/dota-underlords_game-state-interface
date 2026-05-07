import { AppLayout, MainContentTemplate } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { IconTrophy } from '@tabler/icons-react';
import { CombatResults } from '@/features/combat-results';
import './CombatResultsPage.css';

export const CombatResultsPage = () => {
  return (
    <AppLayout>
      <MainContentTemplate className="combat-results-page" centered={false}>
        <div className="combat-results-page__container">
          <PageHeader title="Combat Results" titleIcon="🏆" icon={<IconTrophy size={18} stroke={1.8} />} />
          <div className="combat-results-page__content">
            <CombatResults />
          </div>
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};


