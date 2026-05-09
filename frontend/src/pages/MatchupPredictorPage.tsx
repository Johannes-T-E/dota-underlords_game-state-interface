import { MainContentTemplate } from '@/components/layout';
import { MatchupPredictor } from '@/features/matchup-predictor';
import './MatchupPredictorPage.css';

export const MatchupPredictorPage = () => {
  return (
      <MainContentTemplate className="matchup-predictor-page" centered={false}>
        <div className="matchup-predictor-page__container">
          <MatchupPredictor />
        </div>
      </MainContentTemplate>
  );
};
