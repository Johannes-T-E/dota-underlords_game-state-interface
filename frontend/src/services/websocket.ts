import { io, Socket } from 'socket.io-client';
import type { Store } from '@reduxjs/toolkit';
import { setConnectionStatus } from '@/store/connectionSlice';
import { updateMatch, abandonMatch } from '@/store/matchSlice';
import { addChanges } from '@/store/changesSlice';
import type { MatchData, WebSocketEvents } from '@/types';

class WebSocketService {
  private socket: Socket | null = null;
  private store: Store | null = null;
  private captureNextUpdate: boolean = false;

  initialize(store: Store) {
    this.store = store;
    
    // Determine the socket URL
    const socketURL = import.meta.env.DEV 
      ? 'http://localhost:3000' 
      : window.location.origin;

    this.socket = io(socketURL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket || !this.store) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.store?.dispatch(setConnectionStatus('connected'));
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      this.store?.dispatch(setConnectionStatus('disconnected'));
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.store?.dispatch(setConnectionStatus('error'));
    });

    // Application events
    this.socket.on('connection_response', (data: WebSocketEvents['connection_response']) => {
      console.log('[WebSocket] Connection response:', data);
    });

    this.socket.on('match_update', (data: MatchData) => {
      console.log('[WebSocket] Match update received:', data);
      
      // Debug capture functionality
      if (this.captureNextUpdate) {
        this.captureNextUpdate = false;
        this.downloadDebugData(data);
      }
      
      this.store?.dispatch(updateMatch(data));
    });

    this.socket.on('match_abandoned', (data: WebSocketEvents['match_abandoned']) => {
      console.log('[WebSocket] Match abandoned:', data);
      this.store?.dispatch(abandonMatch());
    });

    this.socket.on('test_response', (data: WebSocketEvents['test_response']) => {
      console.log('[WebSocket] Test response:', data);
    });

    this.socket.on('player_changes', (data: WebSocketEvents['player_changes']) => {
      console.log('[WebSocket] Player changes received:', data);
      
      // Dispatch changes to Redux store (only for current active match)
      // Frontend is stateless - only stores data for current active match
      this.store?.dispatch(addChanges(data.changes));
    });
  }

  testConnection() {
    if (this.socket?.connected) {
      this.socket.emit('test_connection');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getConnectionStatus(): boolean {
    return this.socket?.connected ?? false;
  }

  // Debug functionality
  enableCaptureNextUpdate() {
    this.captureNextUpdate = true;
  }

  isCaptureEnabled(): boolean {
    return this.captureNextUpdate;
  }

  private downloadDebugData(data: MatchData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `underlords_debug_${timestamp}.json`;
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`[Debug] Downloaded match data as ${filename}`);
  }

  injectDebugData(data: MatchData) {
    console.log('[Debug] Injecting debug data:', data);
    this.store?.dispatch(updateMatch(data));
  }
}

export const websocketService = new WebSocketService();

