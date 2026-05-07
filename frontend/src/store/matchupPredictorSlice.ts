import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MatchupPrediction } from '@/types';
import { updateMatch, clearMatch, abandonMatch } from './matchSlice';

interface MatchupPredictorState {
  prediction: MatchupPrediction | null;
  lastUpdate: number | null;
  currentMatchId: string | null;
}

const initialState: MatchupPredictorState = {
  prediction: null,
  lastUpdate: null,
  currentMatchId: null,
};

const matchupPredictorSlice = createSlice({
  name: 'matchupPredictor',
  initialState,
  reducers: {
    setPrediction: (state, action: PayloadAction<MatchupPrediction | null>) => {
      state.prediction = action.payload;
      state.lastUpdate = Date.now();
    },
    clearPrediction: (state) => {
      state.prediction = null;
      state.lastUpdate = null;
      state.currentMatchId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateMatch, (state, action) => {
        const newMatchId = action.payload.match.match_id;
        if (state.currentMatchId !== null && state.currentMatchId !== newMatchId) {
          state.prediction = null;
          state.lastUpdate = null;
        }
        state.currentMatchId = newMatchId;
      })
      .addCase(clearMatch, (state) => {
        state.prediction = null;
        state.lastUpdate = null;
        state.currentMatchId = null;
      })
      .addCase(abandonMatch, (state) => {
        state.prediction = null;
        state.lastUpdate = null;
        state.currentMatchId = null;
      });
  },
});

export const { setPrediction, clearPrediction } = matchupPredictorSlice.actions;
export default matchupPredictorSlice.reducer;
