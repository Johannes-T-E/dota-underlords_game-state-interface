import { useEffect } from 'react';
import { AppLayout, MainContentTemplate } from '../components/templates';
import { ScoreboardContainer } from '../features/scoreboard/ScoreboardContainer';
import { websocketService } from '../services/websocket';
import { store } from '../store/store';

export const Scoreboard = () => {
  useEffect(() => {
    // Initialize WebSocket connection only for the Scoreboard page
    websocketService.initialize(store);

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  return (
    <AppLayout>
      <MainContentTemplate centered>
        <ScoreboardContainer />
      </MainContentTemplate>
    </AppLayout>
  );
};

