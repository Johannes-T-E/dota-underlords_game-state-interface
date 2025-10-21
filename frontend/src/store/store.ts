import { configureStore } from '@reduxjs/toolkit';
import matchReducer from './matchSlice';
import connectionReducer from './connectionSlice';
import matchesReducer from './matchesSlice';
import boardReducer from './boardSlice';

export const store = configureStore({
  reducer: {
    match: matchReducer,
    connection: connectionReducer,
    matches: matchesReducer,
    board: boardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

