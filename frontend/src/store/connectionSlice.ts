import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ConnectionStatus } from '@/types';

interface ConnectionState {
  status: ConnectionStatus;
  error: string | null;
}

const initialState: ConnectionState = {
  status: 'connecting',
  error: null,
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.status = action.payload;
      if (action.payload === 'connected') {
        state.error = null;
      }
    },
    setConnectionError: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
    },
    clearConnectionError: (state) => {
      state.error = null;
    },
  },
});

export const { setConnectionStatus, setConnectionError, clearConnectionError } = connectionSlice.actions;
export default connectionSlice.reducer;

