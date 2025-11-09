import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type WidgetType = 'scoreboard' | 'allPlayerBoards' | 'unitChanges' | 'playerBoard';

export interface WidgetInstance {
  id: string; // e.g., "scoreboard-1" or "board:playerId"
  type: WidgetType;
  visible: boolean;
  instanceNumber: number;
  playerId?: string; // for playerBoard type
}

interface DashboardState {
  widgetInstances: Record<string, WidgetInstance>;
}

// Load initial state from localStorage
const loadInitialState = (): DashboardState => {
  try {
    const saved = localStorage.getItem('dashboard:widgetInstances');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { widgetInstances: parsed };
    }
  } catch (error) {
    console.error('Failed to load widget instances from localStorage:', error);
  }
  
  // Default instances on first load
  return {
    widgetInstances: {
      'scoreboard-1': {
        id: 'scoreboard-1',
        type: 'scoreboard',
        visible: true,
        instanceNumber: 1,
      },
      'allPlayerBoards-1': {
        id: 'allPlayerBoards-1',
        type: 'allPlayerBoards',
        visible: true,
        instanceNumber: 1,
      },
      'unitChanges-1': {
        id: 'unitChanges-1',
        type: 'unitChanges',
        visible: true,
        instanceNumber: 1,
      },
    },
  };
};

const initialState: DashboardState = loadInitialState();

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    addWidgetInstance: (state, action: PayloadAction<{ type: WidgetType; playerId?: string }>) => {
      const { type, playerId } = action.payload;
      
      // For playerBoard, use existing format
      if (type === 'playerBoard' && playerId) {
        const id = `board:${playerId}`;
        state.widgetInstances[id] = {
          id,
          type: 'playerBoard',
          visible: true,
          instanceNumber: 1,
          playerId,
        };
        return;
      }
      
      // For other widget types, find the next instance number
      const existingInstances = Object.values(state.widgetInstances).filter(
        (instance) => instance.type === type
      );
      const nextInstanceNumber = existingInstances.length > 0
        ? Math.max(...existingInstances.map((i) => i.instanceNumber)) + 1
        : 1;
      
      const id = `${type}-${nextInstanceNumber}`;
      state.widgetInstances[id] = {
        id,
        type,
        visible: true,
        instanceNumber: nextInstanceNumber,
      };
    },
    removeWidgetInstance: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.widgetInstances[id];
    },
    toggleWidgetVisibility: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const instance = state.widgetInstances[id];
      if (instance) {
        instance.visible = !instance.visible;
      }
    },
    setWidgetVisibility: (state, action: PayloadAction<{ id: string; visible: boolean }>) => {
      const { id, visible } = action.payload;
      const instance = state.widgetInstances[id];
      if (instance) {
        instance.visible = visible;
      }
    },
  },
});

export const { addWidgetInstance, removeWidgetInstance, toggleWidgetVisibility, setWidgetVisibility } =
  dashboardSlice.actions;

// Persist to localStorage on changes
export const persistWidgetInstances = (state: DashboardState) => {
  try {
    localStorage.setItem('dashboard:widgetInstances', JSON.stringify(state.widgetInstances));
  } catch (error) {
    console.error('Failed to persist widget instances to localStorage:', error);
  }
};

export default dashboardSlice.reducer;

