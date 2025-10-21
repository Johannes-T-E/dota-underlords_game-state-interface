import { configureStore } from '@reduxjs/toolkit';
import matchReducer from './matchSlice';
import connectionReducer from './connectionSlice';
import matchesReducer from './matchesSlice';

export const store = configureStore({
  reducer: {
    match: matchReducer,
    connection: connectionReducer,
    matches: matchesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

