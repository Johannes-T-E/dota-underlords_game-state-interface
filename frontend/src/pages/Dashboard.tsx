import { AppLayout, MainContentTemplate } from '../components/templates';
import { ScoreboardContainer } from '../features/scoreboard/ScoreboardContainer';

export const Dashboard = () => {
  return (
    <AppLayout>
      <MainContentTemplate centered>
        <ScoreboardContainer />
      </MainContentTemplate>
    </AppLayout>
  );
};


