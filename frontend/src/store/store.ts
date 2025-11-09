import { configureStore } from '@reduxjs/toolkit';
import matchReducer from './matchSlice';
import connectionReducer from './connectionSlice';
import matchesReducer from './matchesSlice';
import boardReducer from './boardSlice';
import settingsReducer from './settingsSlice';
import dashboardReducer from './dashboardSlice';

export const store = configureStore({
  reducer: {
    match: matchReducer,
    connection: connectionReducer,
    matches: matchesReducer,
    board: boardReducer,
    settings: settingsReducer,
    dashboard: dashboardReducer,
  },
});

// Persist settings to localStorage on any settings change
store.subscribe(() => {
  const state = store.getState();
  try {
    localStorage.setItem('appSettings', JSON.stringify(state.settings));
  } catch (error) {
    console.error('Failed to persist settings:', error);
  }
});

// Persist widget instances to localStorage on any dashboard change
store.subscribe(() => {
  const state = store.getState();
  try {
    localStorage.setItem('dashboard:widgetInstances', JSON.stringify(state.dashboard.widgetInstances));
  } catch (error) {
    console.error('Failed to persist widget instances:', error);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

