import { configureStore } from '@reduxjs/toolkit';
import matchReducer from './matchSlice';
import connectionReducer from './connectionSlice';
import matchesReducer from './matchesSlice';
import boardReducer from './boardSlice';
import settingsReducer from './settingsSlice';

export const store = configureStore({
  reducer: {
    match: matchReducer,
    connection: connectionReducer,
    matches: matchesReducer,
    board: boardReducer,
    settings: settingsReducer,
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

