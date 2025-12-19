import { AppLayout, MainContentTemplate } from '@/components/layout';
import { CombatResults } from '@/features/combat-results';
import './CombatResultsPage.css';

export const CombatResultsPage = () => {
  return (
    <AppLayout>
      <MainContentTemplate className="combat-results-page" centered={false}>
        <div className="combat-results-page__container">
          <div className="combat-results-page__header">
            <h1 className="combat-results-page__title">Combat Results</h1>
          </div>
          <div className="combat-results-page__content">
            <CombatResults />
          </div>
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};


