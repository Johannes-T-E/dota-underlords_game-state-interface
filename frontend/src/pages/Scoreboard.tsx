import { AppLayout, MainContentTemplate } from '../components/templates';
import { ScoreboardContainer } from '../features/scoreboard/ScoreboardContainer';

export const Scoreboard = () => {
  return (
    <AppLayout>
      <MainContentTemplate centered>
        <ScoreboardContainer />
      </MainContentTemplate>
    </AppLayout>
  );
};

