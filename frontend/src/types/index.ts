// Player state types
export interface Unit {
  unit_id: number;        // Hero type/definition ID (e.g., "Sven" = 4)
  entindex: number;       // Unique entity ID for this specific unit instance
  position: {
    x: number;
    y: number;
  };
  rank: number;
  keywords?: string[];
}

export interface Synergy {
  keyword: string;
  unique_unit_count: number;
}

export interface BoardBuddy {
  board_buddy_id?: number;
}

export interface PlayerState {
  player_id: string;
  account_id: number;
  persona_name?: string;
  bot_persona_name?: string;
  player_slot: number;
  is_human_player: boolean;
  
  // Core stats
  health: number;
  gold: number;
  level: number;
  xp: number;
  next_level_xp: number;
  
  // Match performance
  wins: number;
  losses: number;
  win_streak: number;
  lose_streak: number;
  net_worth: number;
  final_place: number;
  
  // Combat data
  combat_type: number;
  combat_result: number;
  combat_duration: number;
  opponent_player_slot?: number;
  
  // Board and units
  board_unit_limit: number;
  units: Unit[];
  items: number[];
  synergies: Synergy[];
  
  // Underlord data
  underlord: number;
  underlord_selected_talents: number[];
  
  // Event and special data
  event_tier: number;
  owns_event: boolean;
  is_mirrored_match: boolean;
  
  // Connection status
  connection_status: number;
  disconnected_time: number;
  
  // VS opponent stats
  vs_opponent_wins: number;
  vs_opponent_losses: number;
  vs_opponent_draws: number;
  
  // Special mechanics
  brawny_kills_float: number;
  city_prestige_level: number;
  rank_tier?: number;
  platform: number;
  
  // Board buddy
  board_buddy: BoardBuddy;
  
  // Lobby info
  lobby_team: number;
  
  // Technical
  sequence_number: number;
  timestamp: string;
}

export interface ShopUnit {
  unit_id: number;
  keywords?: string[];
}

export interface Challenge {
  challenge_id?: number;
  progress?: number;
  // Add more challenge fields as needed
}

export interface PrivatePlayerState {
  player_slot: number;
  sequence_number: number;
  
  // Shop & Economy
  shop_units: ShopUnit[];
  shop_locked: boolean;
  reroll_cost: number;
  gold_earned_this_round: number;
  shop_generation_id: number;
  
  // Underlord Selection
  can_select_underlord: boolean;
  underlord_picker_offering: number[];
  
  // Challenges & Rewards
  challenges: Challenge[];
  unclaimed_reward_count: number;
  oldest_unclaimed_reward?: number;
  used_item_reward_reroll_this_round: boolean;
  grants_rewards: number;
  
  // Timestamp
  timestamp: string;
}

export interface RoundInfo {
  round_number: number;
  round_phase: 'prep' | 'combat';
  is_combat_phase: boolean;
}

export interface MatchInfo {
  match_id: string;
  started_at: string | null;
  player_count: number;
}

export interface MatchData {
  match: MatchInfo;
  players: PlayerState[];
  private_player: PrivatePlayerState | null;
  current_round: RoundInfo;
  timestamp: number;
}

// API Response types
export interface ApiMatch {
  match_id: string;
  started_at: string;
  ended_at: string | null;
  player_count: number;
  players?: {
    player_id: string;
    persona_name?: string;
    final_place: number;
  }[];
}

export interface ApiMatchesResponse {
  status: string;
  matches: ApiMatch[];
  count: number;
}

export interface ApiStatusResponse {
  active_match: {
    match_id: string;
    started_at: string;
    player_count: number;
  } | null;
  total_updates: number;
  match_count: number;
  last_update: string | null;
}

export interface ApiHealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  database: string;
  queue_size: number;
  connected_clients: number;
  active_match: boolean;
  gsi_endpoint: string;
}

// WebSocket event types
export interface WebSocketEvents {
  connection_response: { status: string };
  match_update: MatchData;
  match_abandoned: {
    match_id: string;
    reason: string;
    timestamp: string;
  };
  test_response: {
    status: string;
    message: string;
  };
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ScoreboardColumnConfig {
  place: boolean;
  player: boolean;          // KEEP: Combined name + level + gold (compact mode)
  playerName: boolean;      // NEW: Just the player name
  level: boolean;           // NEW: Level/XP indicator
  gold: boolean;            // NEW: Gold amount
  streak: boolean;          // NEW: Win/lose streak
  health: boolean;
  record: boolean;
  networth: boolean;
  roster: boolean;
  underlord: boolean;       // NEW: Underlord units
  contraptions: boolean;    // NEW: Contraption units
  bench: boolean;
  columnOrder?: string[];  // NEW: Array of column keys in display order
}

