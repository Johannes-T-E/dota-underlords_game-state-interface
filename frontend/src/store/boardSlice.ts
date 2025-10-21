import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PlayerState } from '../types';

interface BoardState {
  selectedPlayerIds: string[];
  boardData: { [playerId: string]: PlayerState };
}

const initialState: BoardState = {
  selectedPlayerIds: [],
  boardData: {},
};

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    togglePlayerBoard: (state, action: PayloadAction<{ playerId: string; playerData: PlayerState }>) => {
      const { playerId, playerData } = action.payload;
      
      if (state.selectedPlayerIds.includes(playerId)) {
        // Remove from selection
        state.selectedPlayerIds = state.selectedPlayerIds.filter(id => id !== playerId);
        delete state.boardData[playerId];
      } else {
        // Add to selection
        state.selectedPlayerIds.push(playerId);
        state.boardData[playerId] = playerData;
      }
    },
    updateBoardData: (state, action: PayloadAction<{ playerId: string; playerData: PlayerState }>) => {
      const { playerId, playerData } = action.payload;
      if (state.selectedPlayerIds.includes(playerId)) {
        state.boardData[playerId] = playerData;
      }
    },
    clearAllBoards: (state) => {
      state.selectedPlayerIds = [];
      state.boardData = {};
    },
    removePlayerBoard: (state, action: PayloadAction<string>) => {
      const playerId = action.payload;
      state.selectedPlayerIds = state.selectedPlayerIds.filter(id => id !== playerId);
      delete state.boardData[playerId];
    },
  },
});

export const { togglePlayerBoard, updateBoardData, clearAllBoards, removePlayerBoard } = boardSlice.actions;
export default boardSlice.reducer;
