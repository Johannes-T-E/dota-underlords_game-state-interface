import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MatchData, PlayerState, PrivatePlayerState, RoundInfo, MatchInfo, CombatResult, ShopHistoryEntry } from '@/types';

interface MatchState {
  currentMatch: MatchInfo | null;
  players: PlayerState[];
  privatePlayer: PrivatePlayerState | null;
  privatePlayerAccountId: number | null;  // Resolved by backend (player_slot matching)
  currentRound: RoundInfo;
  lastUpdate: number | null;
  combatHistory: Record<number, CombatResult[]>;  // account_id -> CombatResult[]
  shopHistory: ShopHistoryEntry[];
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
  privatePlayerAccountId: null,
  currentRound: {
    round_number: 1,
    round_phase: 'prep',
  },
  lastUpdate: null,
  combatHistory: {},
  shopHistory: [],
  combatDisplayMode: getInitialMode(),
};

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    updateMatch: (state, action: PayloadAction<MatchData>) => {
      const payload = action.payload;
      const matchIdChanged = state.currentMatch?.match_id != null && payload.match.match_id !== state.currentMatch.match_id;

      if (matchIdChanged) {
        state.shopHistory = [];
      }
      state.currentMatch = payload.match;
      state.players = payload.public_player_states;  // Map from new backend field
      state.privatePlayer = payload.private_player_state;  // Map from new backend field
      state.privatePlayerAccountId = payload.private_player_account_id ?? null;
      state.currentRound = payload.current_round;
      state.lastUpdate = payload.timestamp;

      // Append current shop to history if this generation not already present
      const pp = payload.private_player_state;
      if (pp?.shop_units != null && pp.shop_generation_id != null) {
        const alreadyHas = state.shopHistory.some((e) => e.generationId === pp.shop_generation_id);
        if (!alreadyHas) {
          state.shopHistory.push({
            generationId: pp.shop_generation_id,
            shopUnits: [...pp.shop_units],
          });
        }
      }

      // Merge new combat results into history
      if (payload.combat_results) {
        for (const [accountIdStr, newCombats] of Object.entries(payload.combat_results)) {
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
      state.privatePlayerAccountId = null;
      state.currentRound = {
        round_number: 1,
        round_phase: 'prep',
      };
      state.lastUpdate = null;
      state.combatHistory = {};
      state.shopHistory = [];
    },
    abandonMatch: (state) => {
      // Frontend is stateless - clear all match data when match is abandoned
      // Backend is the source of truth for all historical data
      state.currentMatch = null;
      state.players = [];
      state.privatePlayer = null;
      state.privatePlayerAccountId = null;
      state.currentRound = {
        round_number: 1,
        round_phase: 'prep',
      };
      state.lastUpdate = null;
      state.combatHistory = {};
      state.shopHistory = [];
    },
    setShopHistory: (state, action: PayloadAction<ShopHistoryEntry[]>) => {
      state.shopHistory = action.payload;
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

export const { updateMatch, clearMatch, abandonMatch, setCombatHistory, setShopHistory, setCombatDisplayMode } = matchSlice.actions;
export default matchSlice.reducer;

