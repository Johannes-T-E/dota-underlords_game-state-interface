import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ApiMatch } from '@/types';

interface MatchesState {
  matches: ApiMatch[];
  loading: boolean;
  error: string | null;
}

const initialState: MatchesState = {
  matches: [],
  loading: false,
  error: null,
};

const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    setMatches: (state, action: PayloadAction<ApiMatch[]>) => {
      state.matches = action.payload;
      state.loading = false;
      state.error = null;
    },
    setMatchesLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setMatchesError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    removeMatch: (state, action: PayloadAction<string>) => {
      state.matches = state.matches.filter(m => m.match_id !== action.payload);
    },
    clearMatchesError: (state) => {
      state.error = null;
    },
  },
});

export const { 
  setMatches, 
  setMatchesLoading, 
  setMatchesError, 
  removeMatch, 
  clearMatchesError 
} = matchesSlice.actions;
export default matchesSlice.reducer;

