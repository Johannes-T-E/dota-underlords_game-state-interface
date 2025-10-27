import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { Scoreboard } from './pages/Scoreboard';
import { Matches } from './pages/Matches';

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/scoreboard" replace />} />
        <Route path="/scoreboard" element={<Scoreboard />} />
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

