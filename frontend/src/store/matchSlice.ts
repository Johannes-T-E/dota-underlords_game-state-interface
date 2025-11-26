import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MatchData, PlayerState, PrivatePlayerState, RoundInfo, MatchInfo } from '@/types';

interface MatchState {
  currentMatch: MatchInfo | null;
  players: PlayerState[];
  privatePlayer: PrivatePlayerState | null;
  currentRound: RoundInfo;
  lastUpdate: number | null;
}

const initialState: MatchState = {
  currentMatch: null,
  players: [],
  privatePlayer: null,
  currentRound: {
    round_number: 1,
    round_phase: 'prep',
  },
  lastUpdate: null,
};

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    updateMatch: (state, action: PayloadAction<MatchData>) => {
      state.currentMatch = action.payload.match;
      state.players = action.payload.public_player_states;  // Map from new backend field
      state.privatePlayer = action.payload.private_player_state;  // Map from new backend field
      state.currentRound = action.payload.current_round;
      state.lastUpdate = action.payload.timestamp;
    },
    clearMatch: (state) => {
      state.currentMatch = null;
      state.players = [];
      state.privatePlayer = null;
      state.currentRound = {
        round_number: 1,
        round_phase: 'prep',
      };
      state.lastUpdate = null;
    },
    abandonMatch: (state) => {
      // Frontend is stateless - clear all match data when match is abandoned
      // Backend is the source of truth for all historical data
      state.currentMatch = null;
      state.players = [];
      state.privatePlayer = null;
      state.currentRound = {
        round_number: 1,
        round_phase: 'prep',
      };
    },
  },
});

export const { updateMatch, clearMatch, abandonMatch } = matchSlice.actions;
export default matchSlice.reducer;

