import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { updateMatch, clearMatch, abandonMatch } from './matchSlice';
import type { Change } from '@/types';

interface ChangesState {
  changes: Change[];
  lastUpdate: number | null;
  currentMatchId: string | null; // Track current match to detect match changes
}

const initialState: ChangesState = {
  changes: [],
  lastUpdate: null,
  currentMatchId: null,
};

// Maximum number of changes to keep in memory
const MAX_CHANGES = 500;

// Helper function to deduplicate changes
// Uses the same logic as the component: timestamp + account_id + type + unit_id/item_id/synergy_keyword
const deduplicateChanges = (changes: Change[]): Change[] => {
  const seen = new Set<string>();
  return changes.filter((change) => {
    // Create unique key: timestamp + account_id + change type + unit_id/item_id/synergy_keyword
    const key = `${change.timestamp}-${change.account_id}-${change.type}-${
      change.unit_id ?? change.item_id ?? change.synergy_keyword ?? ''
    }`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const changesSlice = createSlice({
  name: 'changes',
  initialState,
  reducers: {
    // Add new changes to existing changes for current match (with deduplication)
    // Frontend is stateless - only stores data for current active match
    addChanges: (state, action: PayloadAction<Change[]>) => {
      const newChanges = action.payload;
      
      // Merge new changes with existing, then deduplicate
      const allChanges = [...newChanges, ...state.changes];
      const uniqueChanges = deduplicateChanges(allChanges);
      
      // Limit to MAX_CHANGES, keeping the most recent
      state.changes = uniqueChanges.slice(0, MAX_CHANGES);
      state.lastUpdate = Date.now();
    },
    
    // Set all changes for current match (used for API fetch - replaces existing)
    // Frontend is stateless - only stores data for current active match
    setChanges: (state, action: PayloadAction<Change[]>) => {
      const changes = action.payload;
      
      // Deduplicate the changes from API
      const uniqueChanges = deduplicateChanges(changes);
      
      // Limit to MAX_CHANGES, keeping the most recent
      state.changes = uniqueChanges.slice(0, MAX_CHANGES);
      state.lastUpdate = Date.now();
    },
    
    // Clear all changes (for current match)
    clearChanges: (state) => {
      state.changes = [];
      state.lastUpdate = null;
      state.currentMatchId = null;
    },
  },
  extraReducers: (builder) => {
    // Frontend is stateless - backend is the source of truth for all historical data
    // Clear all changes when match ends, abandons, or new match starts
    builder
      .addCase(updateMatch, (state, action) => {
        const newMatchId = action.payload.match.match_id;
        
        // If match_id changed, clear previous match's changes (new match started)
        if (state.currentMatchId !== null && state.currentMatchId !== newMatchId) {
          state.changes = [];
          state.lastUpdate = null;
        }
        
        state.currentMatchId = newMatchId;
      })
      .addCase(clearMatch, (state) => {
        // Clear all changes when match is cleared
        state.changes = [];
        state.lastUpdate = null;
        state.currentMatchId = null;
      })
      .addCase(abandonMatch, (state) => {
        // Clear all changes when match is abandoned
        state.changes = [];
        state.lastUpdate = null;
        state.currentMatchId = null;
      });
  },
});

export const { addChanges, setChanges, clearChanges } = changesSlice.actions;
export default changesSlice.reducer;

// Selectors
// Frontend is stateless - only returns changes for current active match
export const selectChangesForCurrentMatch = (state: { 
  changes: ChangesState;
}) => {
  return state.changes.changes;
};

export const selectChangesCount = (state: { changes: ChangesState }) => {
  return state.changes.changes.length;
};

export const selectLastUpdate = (state: { changes: ChangesState }) => {
  return state.changes.lastUpdate;
};
