import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { websocketService } from './services/websocket';
import { Dashboard } from './pages/Dashboard';
import { Matches } from './pages/Matches';

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
        <Route path="/matches" element={<Matches />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;

