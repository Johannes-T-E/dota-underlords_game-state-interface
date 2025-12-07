import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { CombatResult, PlayerState } from '@/types';
import { PlayerNameDisplay } from '@/components/ui';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { setCombatDisplayMode } from '@/store/matchSlice';
import { useBotNames } from '@/hooks/useBotNames';
import './CombatResultsTable.css';

export interface CombatResultsTableProps {
  combatHistory: Record<number, CombatResult[]>;
  players: PlayerState[];
  className?: string;
}

const MAX_ROUNDS = 40;

export const CombatResultsTable = ({ 
  combatHistory, 
  players,
  className = '' 
}: CombatResultsTableProps) => {
  const dispatch = useAppDispatch();
  const { currentRound, combatDisplayMode } = useAppSelector((state) => state.match);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [hoveredPlayerId, setHoveredPlayerId] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ roundNumber: number; accountId: number } | null>(null);
  const [sortMode, setSortMode] = useState<'player_slot' | 'hp'>('player_slot');
  
  // Timer state
  const [combatTimer, setCombatTimer] = useState<number | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentRoundRef = useRef<number>(currentRound?.round_number || 1);
  
  // Track when combats were received (for delayed display in main mode)
  // Limit to current round and previous round to prevent memory growth
  const combatReceivedTimesRef = useRef<Map<string, number>>(new Map());
  
  // Track which rounds have completed their timer (to prevent restarting)
  const completedTimerRoundsRef = useRef<Set<number>>(new Set());
  
  const { getBotName } = useBotNames();

  // Create a map of account_id -> player for quick lookup
  const playersMap = useMemo(() => {
    const map = new Map<number, PlayerState>();
    players.forEach(player => {
      if (player.account_id != null) {
        map.set(player.account_id, player);
      }
    });
    return map;
  }, [players]);

  // Gap marker type for visual separation between groups
  type GapMarker = { type: 'gap' };
  type PlayerOrGap = PlayerState | (PlayerState & { isTemporaryBot: true; originalAccountId: number }) | GapMarker;

  // Get player name helper (matches PlayerNameDisplay logic)
  // Memoized to prevent function recreation on every render
  const getPlayerName = useCallback((accountId: number): string => {
    const player = playersMap.get(accountId);
    if (!player) return `Player ${accountId}`;
    
    // Get translated bot name if it exists (same logic as PlayerNameDisplay)
    const translatedBotName = player.bot_persona_name ? getBotName(player.bot_persona_name) : undefined;
    
    // Use persona_name, translated bot name, or fallback to bot_persona_name or player_slot
    return player.persona_name || translatedBotName || player.bot_persona_name || `Player ${player.player_slot}`;
  }, [playersMap, getBotName]);

  // Create temporary bot player from opponent data
  const createTemporaryBotPlayer = (opponentPlayer: PlayerState, roundNumber: number): PlayerState & { isTemporaryBot: true; originalAccountId: number } => {
    const displayName = getPlayerName(opponentPlayer.account_id!);
    return {
      ...opponentPlayer,
      account_id: `bot_${opponentPlayer.account_id}_${roundNumber}` as any, // Unique identifier
      isTemporaryBot: true,
      originalAccountId: opponentPlayer.account_id!, // Reference to real player for combat data
      // Override persona_name to include "(bot)" suffix
      persona_name: `${displayName} (bot)`,
    };
  };

  // Filter combats based on selected player or hovered player
  // If selectedPlayerId or hoveredPlayerId is set, only show combats involving that player
  const filteredCombatHistory = useMemo(() => {
    const filterPlayerId = hoveredPlayerId ?? selectedPlayerId;
    if (filterPlayerId === null) {
      return combatHistory;
    }

    const filtered: Record<number, CombatResult[]> = {};
    Object.entries(combatHistory).forEach(([accIdStr, combats]) => {
      const accountId = Number(accIdStr);
      const relevantCombats = combats.filter(combat => 
        combat.player_account_id === filterPlayerId || 
        combat.opponent_account_id === filterPlayerId
      );
      if (relevantCombats.length > 0) {
        filtered[accountId] = relevantCombats;
      }
    });
    return filtered;
  }, [combatHistory, selectedPlayerId, hoveredPlayerId]);

  // Get current round combat groups
  // Use full combatHistory (not filtered) to ensure groups are always complete
  // This allows filtering to work correctly while keeping groups intact
  const getCurrentRoundCombatGroups = useMemo(() => {
    if (currentRound?.round_phase !== 'combat') {
      return [];
    }

    const currentRoundNumber = currentRound.round_number;
    const groups: Array<Array<PlayerState | (PlayerState & { isTemporaryBot: true; originalAccountId: number })>> = [];
    const processedPlayers = new Set<number>();
    const processedBots = new Set<string>();

    // Collect all combats for current round from full combatHistory
    // This ensures groups are complete even when filtering is applied
    const currentRoundCombats: CombatResult[] = [];
    Object.entries(combatHistory).forEach(([, combats]) => {
      combats.forEach(combat => {
        if (combat.round_number === currentRoundNumber) {
          currentRoundCombats.push(combat);
        }
      });
    });

    // Process real matches (combat_type 2 or 3)
    currentRoundCombats.forEach(combat => {
      if (combat.combat_type === 2 || combat.combat_type === 3) {
        const player1Id = combat.player_account_id;
        const player2Id = combat.opponent_account_id;

        // Skip if either player already processed
        if (processedPlayers.has(player1Id) || processedPlayers.has(player2Id)) {
          return;
        }

        const player1 = playersMap.get(player1Id);
        const player2 = playersMap.get(player2Id);

        if (player1 && player2) {
          groups.push([player1, player2]);
          processedPlayers.add(player1Id);
          processedPlayers.add(player2Id);
        }
      }
    });

    // Process bot fights (combat_type 1)
    currentRoundCombats.forEach(combat => {
      if (combat.combat_type === 1) {
        const playerId = combat.player_account_id;
        const opponentId = combat.opponent_account_id;

        // Skip if player already processed
        if (processedPlayers.has(playerId)) {
          return;
        }

        const player = playersMap.get(playerId);
        const opponent = playersMap.get(opponentId);

        if (player && opponent) {
          const botId = `bot_${opponentId}_${currentRoundNumber}`;
          // Skip if bot already created
          if (processedBots.has(botId)) {
            return;
          }

          const tempBot = createTemporaryBotPlayer(opponent, currentRoundNumber);
          groups.push([player, tempBot]);
          processedPlayers.add(playerId);
          processedBots.add(botId);
        }
      }
    });

    // Sort groups by lowest player_slot in each group
    groups.sort((a, b) => {
      const aMinSlot = Math.min(...a.map(p => p.player_slot || 0));
      const bMinSlot = Math.min(...b.map(p => p.player_slot || 0));
      return aMinSlot - bMinSlot;
    });

    return groups;
  }, [currentRound, combatHistory, playersMap, getPlayerName, createTemporaryBotPlayer]);

  // Track when new combats are received and initialize timer
  useEffect(() => {
    const now = Date.now();
    let longestDuration = 0;
    let hasNewCombats = false;
    const currentRoundNumber = currentRound?.round_number || 1;
    
    // Clean up old combat received times (keep only current and previous round)
    // This prevents the Map from growing indefinitely
    const roundsToKeep = new Set([currentRoundNumber, currentRoundNumber - 1]);
    const keysToDelete: string[] = [];
    combatReceivedTimesRef.current.forEach((_, key) => {
      // Extract round number from key format: "playerId-opponentId-roundNumber"
      const parts = key.split('-');
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        const roundNum = parseInt(lastPart, 10);
        if (!isNaN(roundNum) && !roundsToKeep.has(roundNum)) {
          keysToDelete.push(key);
        }
      }
    });
    keysToDelete.forEach(key => combatReceivedTimesRef.current.delete(key));
    
    // Check for new combats and track their receive time
    Object.entries(combatHistory).forEach(([, combats]) => {
      combats.forEach(combat => {
        const combatKey = `${combat.player_account_id}-${combat.opponent_account_id}-${combat.round_number}`;
        
        // If this combat hasn't been tracked yet, it's new
        if (!combatReceivedTimesRef.current.has(combatKey)) {
          combatReceivedTimesRef.current.set(combatKey, now);
          hasNewCombats = true;
        }
        
        // Track longest duration for timer
        if (combat.round_number === currentRoundNumber && combat.combat_duration > longestDuration) {
          longestDuration = combat.combat_duration;
        }
      });
    });
    
    // Initialize timer if we have new combats for current round
    // Only start timer if it hasn't been completed for this round yet
    if (hasNewCombats && longestDuration > 0 && currentRoundNumber) {
      // Only set timer if:
      // 1. Timer is not already active for this round, AND
      // 2. This round hasn't completed its timer yet
      if ((!isTimerActive || currentRoundRef.current !== currentRoundNumber) && 
          !completedTimerRoundsRef.current.has(currentRoundNumber)) {
        setCombatTimer(Math.ceil(longestDuration));
        setIsTimerActive(true);
        currentRoundRef.current = currentRoundNumber;
      }
    }
  }, [combatHistory, currentRound?.round_number, isTimerActive]);
  
  // Timer countdown effect
  useEffect(() => {
    // Clear any existing interval first to prevent multiple intervals
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (isTimerActive && combatTimer !== null && combatTimer > 0) {
      timerIntervalRef.current = setInterval(() => {
        setCombatTimer(prev => {
          if (prev === null || prev <= 1) {
            setIsTimerActive(false);
            // Mark this round's timer as completed
            if (currentRoundRef.current) {
              completedTimerRoundsRef.current.add(currentRoundRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isTimerActive, combatTimer]);
  
  // Reset timer when round changes
  useEffect(() => {
    if (currentRoundRef.current !== currentRound?.round_number) {
      setCombatTimer(null);
      setIsTimerActive(false);
      currentRoundRef.current = currentRound?.round_number || 1;
      // Clear completed rounds when moving to a new round (keep only last 2 rounds)
      const currentRoundNumber = currentRound?.round_number || 1;
      const roundsToKeep = new Set([currentRoundNumber, currentRoundNumber - 1]);
      completedTimerRoundsRef.current.forEach(roundNum => {
        if (!roundsToKeep.has(roundNum)) {
          completedTimerRoundsRef.current.delete(roundNum);
        }
      });
    }
  }, [currentRound?.round_number]);

  // Helper to get player HP for sorting
  const getPlayerHP = (player: PlayerState | (PlayerState & { isTemporaryBot: true; originalAccountId: number })): number => {
    if ('isTemporaryBot' in player && player.isTemporaryBot) {
      // For temporary bots, get HP from the original player in the players array
      const originalPlayer = players.find(p => p.account_id === player.originalAccountId);
      return originalPlayer?.health || 0;
    }
    return player.health || 0;
  };

  // Helper to get player final_place for sorting
  const getPlayerFinalPlace = (player: PlayerState | (PlayerState & { isTemporaryBot: true; originalAccountId: number })): number => {
    if ('isTemporaryBot' in player && player.isTemporaryBot) {
      // For temporary bots, get final_place from the original player
      const originalPlayer = players.find(p => p.account_id === player.originalAccountId);
      return originalPlayer?.final_place || 0;
    }
    return player.final_place || 0;
  };

  // Helper to check if player is knocked out
  const isPlayerKnockedOut = (player: PlayerState | (PlayerState & { isTemporaryBot: true; originalAccountId: number })): boolean => {
    return getPlayerFinalPlace(player) > 0;
  };

  // Sort function matching scoreboard logic
  const sortPlayersByMode = (
    a: PlayerState | (PlayerState & { isTemporaryBot: true; originalAccountId: number }),
    b: PlayerState | (PlayerState & { isTemporaryBot: true; originalAccountId: number })
  ): number => {
    // Separate active players (final_place === 0) from knocked-out players (final_place > 0)
    const aKnockedOut = isPlayerKnockedOut(a);
    const bKnockedOut = isPlayerKnockedOut(b);

    // Active players come first
    if (!aKnockedOut && bKnockedOut) return -1;
    if (aKnockedOut && !bKnockedOut) return 1;

    // If both are knocked out, sort by final_place (1st at top, 8th at bottom)
    if (aKnockedOut && bKnockedOut) {
      const aPlace = getPlayerFinalPlace(a);
      const bPlace = getPlayerFinalPlace(b);
      return aPlace - bPlace; // Ascending: 1, 2, 3, ..., 8
    }

    // Both are active players - sort by selected field
    let aValue = 0;
    let bValue = 0;

    if (sortMode === 'hp') {
      aValue = getPlayerHP(a);
      bValue = getPlayerHP(b);
      return bValue - aValue; // Descending: highest HP first
    } else {
      // Sort by player_slot
      aValue = a.player_slot || 0;
      bValue = b.player_slot || 0;
      return aValue - bValue; // Ascending: slot 1, 2, 3, ...
    }
  };

  // Check if match is complete (all players knocked out)
  const isMatchComplete = useMemo(() => {
    const activePlayers = players.filter(p => p.account_id != null && (p.final_place || 0) === 0);
    return activePlayers.length === 0 && players.length > 0;
  }, [players]);

  // Determine effective round phase (force prep if match is complete)
  const effectiveRoundPhase = useMemo(() => {
    if (isMatchComplete) {
      return 'prep'; // Force normal display when match ends
    }
    return currentRound?.round_phase || 'prep';
  }, [isMatchComplete, currentRound?.round_phase]);

  // Dynamic player sorting based on round phase and sort mode
  const sortedPlayers: PlayerOrGap[] = useMemo(() => {
    if (effectiveRoundPhase === 'combat') {
      // Combat phase: group by combat matchups
      const groups = getCurrentRoundCombatGroups;
      const result: PlayerOrGap[] = [];
      
      // Sort groups by sort mode
      const sortedGroups = [...groups];
      if (sortMode === 'hp') {
        // Sort groups by highest HP in each group (descending)
        // But still respect knocked-out players (they should be at bottom)
        sortedGroups.sort((a, b) => {
          // Check if groups have knocked-out players
          const aHasKnockedOut = a.some(p => isPlayerKnockedOut(p));
          const bHasKnockedOut = b.some(p => isPlayerKnockedOut(p));
          
          // Groups with knocked-out players go to bottom
          if (!aHasKnockedOut && bHasKnockedOut) return -1;
          if (aHasKnockedOut && !bHasKnockedOut) return 1;
          
          // Both groups have same knocked-out status, sort by HP
          const aMaxHP = Math.max(...a.map(p => getPlayerHP(p)));
          const bMaxHP = Math.max(...b.map(p => getPlayerHP(p)));
          return bMaxHP - aMaxHP; // Descending: highest HP first
        });
        
        // Sort players within each group by HP (with knocked-out at bottom)
        sortedGroups.forEach(group => {
          group.sort(sortPlayersByMode);
        });
      } else {
        // Sort groups by lowest player_slot (existing behavior)
        sortedGroups.sort((a, b) => {
          const aMinSlot = Math.min(...a.map(p => p.player_slot || 0));
          const bMinSlot = Math.min(...b.map(p => p.player_slot || 0));
          return aMinSlot - bMinSlot;
        });
      }
      
      sortedGroups.forEach((group, index) => {
        // Add players from this group
        group.forEach(player => result.push(player));
        // Add gap marker after group (except last group)
        if (index < sortedGroups.length - 1) {
          result.push({ type: 'gap' });
        }
      });
      
      return result;
    } else {
      // Prep phase: sort by selected mode (with knocked-out players at bottom)
      const filtered = players.filter(p => p.account_id != null);
      return filtered.sort(sortPlayersByMode);
    }
  }, [players, effectiveRoundPhase, getCurrentRoundCombatGroups, sortMode]);
  
  // Force re-render every second in main mode to update overlay timers
  // Note: remainingTime is now calculated inline, so we just need to trigger re-render
  const [, setTick] = useState(0);
  useEffect(() => {
    if (combatDisplayMode === 'main') {
      const interval = setInterval(() => {
        setTick(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [combatDisplayMode]);

  // Helper to calculate remaining time for overlay in main mode
  const getCombatRemainingTime = (combat: CombatResult): number | null => {
    if (combatDisplayMode === 'revealing') return null;
    
    const currentRoundNumber = currentRound?.round_number || 1;
    // Previous rounds should never have overlay
    if (combat.round_number < currentRoundNumber) return null;
    
    const combatKey = `${combat.player_account_id}-${combat.opponent_account_id}-${combat.round_number}`;
    const receivedTime = combatReceivedTimesRef.current.get(combatKey);
    
    if (receivedTime === undefined) return null;
    
    const now = Date.now();
    const elapsedSeconds = (now - receivedTime) / 1000;
    // Display 5.5 seconds earlier to account for delay
    const adjustedDuration = Math.max(0, combat.combat_duration - 5.5);
    const remaining = adjustedDuration - elapsedSeconds;
    
    return remaining > 0 ? Math.ceil(remaining) : null;
  };

  // Build round data: for each round (1-40), determine what happened for each player
  // Store combat data structure (remainingTime calculated inline in render to avoid recalculation on tick)
  const roundData = useMemo(() => {
    // Map can have number keys (real players) or string keys (temporary bots)
    const rounds: Array<Map<number | string, { result: string; opponentAccountId: number; opponentName: string; isBotFight: boolean; combat: CombatResult }>> = [];
    
    // Initialize all rounds
    for (let round = 1; round <= MAX_ROUNDS; round++) {
      rounds.push(new Map());
    }

    // Populate rounds with all combat data - store combat object for inline remainingTime calculation
    Object.entries(filteredCombatHistory).forEach(([accIdStr, combats]) => {
      const accountId = Number(accIdStr);
      combats.forEach(combat => {
        const roundIndex = combat.round_number - 1;
        if (roundIndex >= 0 && roundIndex < MAX_ROUNDS) {
          const roundMap = rounds[roundIndex];
          if (!roundMap) return;
          
          const opponentName = getPlayerName(combat.opponent_account_id);
          const isBotFight = combat.combat_type === 1; // combat_type 1 = fighting bot
          
          // Store from this player's perspective - always store actual result
          // Store combat object so we can calculate remainingTime inline
          roundMap.set(accountId, {
            result: combat.result,
            opponentAccountId: combat.opponent_account_id,
            opponentName,
            isBotFight,
            combat // Store combat for inline remainingTime calculation
          });

          // Only store from opponent's perspective if it's a real match (combat_type 2 or 3)
          // If combat_type = 1, the opponent is fighting someone else, so don't create their record
          if (combat.combat_type === 2 || combat.combat_type === 3) {
            const opponentResult = combat.result === 'win' ? 'loss' : 
                                   combat.result === 'loss' ? 'win' : 'draw';
            const thisPlayerName = getPlayerName(accountId);
            roundMap.set(combat.opponent_account_id, {
              result: opponentResult,
              opponentAccountId: accountId,
              opponentName: thisPlayerName,
              isBotFight: false, // From opponent's perspective, it's a real match
              combat // Store combat for inline remainingTime calculation
            });
          } else if (combat.combat_type === 1) {
            // For bot fights (combat_type 1), create combat data for the temporary bot
            // The bot should show the inverse result and use the same combat_duration
            const botResult = combat.result === 'win' ? 'loss' : 
                             combat.result === 'loss' ? 'win' : 'draw';
            const botId = `bot_${combat.opponent_account_id}_${combat.round_number}`;
            const realPlayerName = getPlayerName(accountId);
            // Store bot's combat data with inverted result
            roundMap.set(botId as any, {
              result: botResult,
              opponentAccountId: accountId, // The real player the bot is fighting
              opponentName: realPlayerName,
              isBotFight: false, // From bot's perspective, it's fighting the real player
              combat // Store combat for inline remainingTime calculation
            });
          }
        }
      });
    });

    return rounds;
  }, [filteredCombatHistory, playersMap, getPlayerName]);

  const getResultColor = (result: string): string => {
    switch (result) {
      case 'win':
        return 'var(--win-streak-color)';
      case 'loss':
        return 'var(--lose-streak-color)';
      case 'draw':
        return '#F5C95C'; // Yellow for draws
      default:
        return 'var(--text-color)';
    }
  };

  const getResultBgColor = (result: string): string => {
    switch (result) {
      case 'win':
        return 'rgba(46, 204, 64, 0.2)';
      case 'loss':
        return 'rgba(231, 76, 60, 0.2)';
      case 'draw':
        return 'rgba(245, 201, 92, 0.2)'; // Yellow background for draws
      default:
        return 'rgba(255, 255, 255, 0.05)';
    }
  };

  const isCurrentRound = (roundNumber: number): boolean => {
    return currentRound?.round_number === roundNumber;
  };
  
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleModeToggle = (mode: 'revealing' | 'main') => {
    dispatch(setCombatDisplayMode(mode));
  };

  return (
    <div className={`combat-results-table ${className}`}>
      {/* Controls */}
      <div className="combat-results-table__controls">
        <label className="combat-results-table__label">
          Show as:
          <select
            className="combat-results-table__select"
            value={selectedPlayerId ?? ''}
            onChange={(e) => setSelectedPlayerId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All Players</option>
            {sortedPlayers
              .filter((item): item is PlayerState => 'account_id' in item && item.account_id != null)
              .map(player => (
                <option key={player.account_id} value={player.account_id}>
                  {getPlayerName(player.account_id!)}
                </option>
              ))}
          </select>
        </label>
        
        <label className="combat-results-table__label">
          Sort by:
          <select
            className="combat-results-table__select"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as 'player_slot' | 'hp')}
          >
            <option value="player_slot">Player Slot</option>
            <option value="hp">HP</option>
          </select>
        </label>
        
        <div className="combat-results-table__mode-controls">
          <button
            className={`combat-results-table__mode-button ${
              combatDisplayMode === 'main' ? 'combat-results-table__mode-button--active' : ''
            }`}
            onClick={() => handleModeToggle('main')}
          >
            Main
          </button>
          <button
            className={`combat-results-table__mode-button ${
              combatDisplayMode === 'revealing' ? 'combat-results-table__mode-button--active' : ''
            }`}
            onClick={() => handleModeToggle('revealing')}
          >
            Revealing
          </button>
        </div>
        
        {isTimerActive && combatTimer !== null && (
          <div className="combat-results-table__timer">
            {formatTimer(combatTimer)}
          </div>
        )}
      </div>

      <div className="combat-results-table__wrapper">
        <table className="combat-results-table__table">
          <thead>
            <tr>
              <th className="combat-results-table__header-cell combat-results-table__header-cell--player">
                Player
              </th>
              {Array.from({ length: MAX_ROUNDS }, (_, i) => i + 1).map(roundNumber => (
                <th 
                  key={roundNumber} 
                  className={`combat-results-table__header-cell combat-results-table__header-cell--combat ${
                    isCurrentRound(roundNumber) ? 'combat-results-table__header-cell--current' : ''
                  }`}
                >
                  R{roundNumber}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((item, index) => {
              // Handle gap markers
              if ('type' in item && item.type === 'gap') {
                return (
                  <tr key={`gap-${index}`} className="combat-results-table__row combat-results-table__row--group-separator">
                    <td colSpan={MAX_ROUNDS + 1}></td>
                  </tr>
                );
              }

              // Handle player rows
              const player = item as PlayerState | (PlayerState & { isTemporaryBot: true; originalAccountId: number });
              const accountId = 'isTemporaryBot' in player && player.isTemporaryBot 
                ? player.originalAccountId 
                : player.account_id!;
              const displayAccountId = typeof player.account_id === 'string' 
                ? player.account_id 
                : player.account_id!;
              
              return (
                <tr key={displayAccountId} className="combat-results-table__row">
                  <td 
                    className={`combat-results-table__cell combat-results-table__cell--player ${
                      hoveredPlayerId === accountId ? 'combat-results-table__cell--player-hovered' : ''
                    }`}
                    onMouseEnter={() => setHoveredPlayerId(accountId)}
                    onMouseLeave={() => setHoveredPlayerId(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <PlayerNameDisplay
                      personaName={player.persona_name}
                      botPersonaName={player.bot_persona_name}
                      matchCount={player.match_count}
                    />
                  </td>
                  {roundData.map((roundCombatData, roundIndex) => {
                    const roundNumber = roundIndex + 1;
                    // For temporary bots, use their bot ID to look up combat data (which has inverted result)
                    // For real players, use their account_id
                    const lookupAccountId = 'isTemporaryBot' in player && player.isTemporaryBot 
                      ? (typeof player.account_id === 'string' ? player.account_id : player.account_id!)
                      : accountId;
                    const combatData = roundCombatData.get(lookupAccountId);
                    
                    // Check if this cell or its opponent's cell is being hovered
                    const isHovered = hoveredCell?.roundNumber === roundNumber && hoveredCell?.accountId === accountId;
                    const isOpponentHovered = combatData && 
                      hoveredCell?.roundNumber === roundNumber && 
                      hoveredCell?.accountId === combatData.opponentAccountId;
                    const shouldHighlight = isHovered || isOpponentHovered;
                    
                    if (!combatData) {
                      return (
                        <td 
                          key={roundNumber} 
                          className={`combat-results-table__cell combat-results-table__cell--combat combat-results-table__cell--empty ${
                            isCurrentRound(roundNumber) ? 'combat-results-table__cell--current' : ''
                          }`}
                        >
                          —
                        </td>
                      );
                    }
                    
                    // Calculate remaining time inline (avoids full roundData recalculation on tick)
                    const remainingTime = getCombatRemainingTime(combatData.combat);
                    const showOverlay = remainingTime !== null && remainingTime > 0;
                    
                    return (
                      <td 
                        key={roundNumber}
                        className={`combat-results-table__cell combat-results-table__cell--combat ${
                          isCurrentRound(roundNumber) ? 'combat-results-table__cell--current' : ''
                        } ${combatData.isBotFight ? 'combat-results-table__cell--bot' : ''} ${
                          shouldHighlight ? 'combat-results-table__cell--highlighted' : ''
                        }`}
                        style={{
                          backgroundColor: getResultBgColor(combatData.result),
                          color: getResultColor(combatData.result),
                          position: 'relative', // For overlay positioning
                        }}
                        title={`Round ${roundNumber} vs ${combatData.opponentName}${combatData.isBotFight ? ' (Bot)' : ''}${showOverlay ? ` - Revealing in ${remainingTime}s` : ''}`}
                        onMouseEnter={() => setHoveredCell({ roundNumber, accountId })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {/* Always show the actual result */}
                        <span className="combat-results-table__result-label">
                          {combatData.result.toUpperCase()}
                          {combatData.isBotFight && (
                            <span className="combat-results-table__bot-indicator">B</span>
                          )}
                        </span>
                        {/* Overlay that covers the result when timer is active */}
                        {showOverlay && (
                          <div className="combat-results-table__cell-overlay">
                            <span className="combat-results-table__timer-label">
                              {remainingTime}s
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

