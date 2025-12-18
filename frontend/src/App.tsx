import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { websocketService } from './services/websocket';
import { HeroesDataProvider } from './contexts/HeroesDataContext';
import { Dashboard } from './pages/Dashboard';
import { MatchManagement } from './pages/MatchManagement';
import { ScoreboardPage } from './pages/ScoreboardPage';
import { ShopPage } from './pages/ShopPage';
import { PlayerBoardsPage } from './pages/PlayerBoardsPage';
import { PlayerBoardPage } from './pages/PlayerBoardPage';
import { CombatResultsPage } from './pages/CombatResultsPage';
import { HeroPoolStatsPage } from './pages/HeroPoolStatsPage';

function AppContent() {
  useEffect(() => {
    // Initialize WebSocket connection once for the entire app
    websocketService.initialize(store);

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/match-management" element={<MatchManagement />} />
        <Route path="/scoreboard" element={<ScoreboardPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/player-boards" element={<PlayerBoardsPage />} />
        <Route path="/player-board/:accountId" element={<PlayerBoardPage />} />
        <Route path="/combat-results" element={<CombatResultsPage />} />
        <Route path="/hero-pool-stats" element={<HeroPoolStatsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <Provider store={store}>
      <HeroesDataProvider>
        <AppContent />
      </HeroesDataProvider>
    </Provider>
  );
}

export default App;

