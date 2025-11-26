import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { websocketService } from './services/websocket';
import { HeroesDataProvider } from './contexts/HeroesDataContext';
import { Dashboard } from './pages/Dashboard';
import { MatchManagement } from './pages/MatchManagement';

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

