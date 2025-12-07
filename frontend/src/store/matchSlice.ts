import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MatchData, PlayerState, PrivatePlayerState, RoundInfo, MatchInfo, CombatResult } from '@/types';

interface MatchState {
  currentMatch: MatchInfo | null;
  players: PlayerState[];
  privatePlayer: PrivatePlayerState | null;
  currentRound: RoundInfo;
  lastUpdate: number | null;
  combatHistory: Record<number, CombatResult[]>;  // account_id -> CombatResult[]
  combatDisplayMode: 'revealing' | 'main';
}

// Load mode from localStorage or default to 'main'
const getInitialMode = (): 'revealing' | 'main' => {
  try {
    const saved = localStorage.getItem('combatDisplayMode');
    if (saved === 'revealing' || saved === 'main') {
      return saved;
    }
  } catch (e) {
    // localStorage not available, use default
  }
  return 'main';
};

const initialState: MatchState = {
  currentMatch: null,
  players: [],
  privatePlayer: null,
  currentRound: {
    round_number: 1,
    round_phase: 'prep',
  },
  lastUpdate: null,
  combatHistory: {},
  combatDisplayMode: getInitialMode(),
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
      
      // Merge new combat results into history
      if (action.payload.combat_results) {
        for (const [accountIdStr, newCombats] of Object.entries(action.payload.combat_results)) {
          const accountId = Number(accountIdStr);
          if (!state.combatHistory[accountId]) {
            state.combatHistory[accountId] = [];
          }
          // Append new combats (backend sends only new ones)
          state.combatHistory[accountId].push(...newCombats);
        }
      }
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
      state.combatHistory = {};
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
      state.combatHistory = {};
    },
    setCombatHistory: (state, action: PayloadAction<Record<number, CombatResult[]>>) => {
      // Set full combat history (e.g., from API fetch on refresh)
      state.combatHistory = action.payload;
    },
    setCombatDisplayMode: (state, action: PayloadAction<'revealing' | 'main'>) => {
      state.combatDisplayMode = action.payload;
      // Persist to localStorage
      try {
        localStorage.setItem('combatDisplayMode', action.payload);
      } catch (e) {
        // localStorage not available, ignore
      }
    },
  },
});

export const { updateMatch, clearMatch, abandonMatch, setCombatHistory, setCombatDisplayMode } = matchSlice.actions;
export default matchSlice.reducer;

