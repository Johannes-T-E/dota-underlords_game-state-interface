import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Widget } from '../../components/widgets/Widget';
import { Text, PhaseIcon, Button } from '../../components/atoms';
import { HeroPortrait, HealthDisplay, LevelXpIndicator, SettingsSection } from '../../components/molecules';
import { useAppSelector } from '../../hooks/redux';
import { useHeroesData } from '../../hooks/useHeroesData';
import type { PlayerState, Change } from '../../types';
import './UnitChangesWidget.css';

export interface UnitChangesWidgetProps {
  storageKey?: string;
  dragId?: string;
  onHeaderMouseDown?: (e: React.MouseEvent, id: string) => void;
}

// Helper function to get player_id with fallback to account_id
const getPlayerId = (player: PlayerState): string => {
  return player.player_id || String(player.account_id);
};

export const UnitChangesWidget = ({ storageKey, dragId, onHeaderMouseDown }: UnitChangesWidgetProps) => {
  const { heroesData } = useHeroesData();
  const { players, currentRound } = useAppSelector((state) => state.match);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [changeFilters, setChangeFilters] = useState<{
    all: boolean;
    bought: boolean;
    sold: boolean;
    upgraded: boolean;
    benched: boolean;
    deployed: boolean;
    reposition: boolean;
    organize_bench: boolean;
    reroll: boolean;
    xp_purchase: boolean;
    level_up: boolean;
    hp_change: boolean;
  }>({
    all: true,
    bought: true,
    sold: true,
    upgraded: true,
    benched: true,
    deployed: true,
    reposition: true,
    organize_bench: true,
    reroll: true,
    xp_purchase: true,
    level_up: true,
    hp_change: true,
  });
  const [changes, setChanges] = useState<Change[]>([]);
  const previousPlayersRef = useRef<Map<string, PlayerState>>(new Map());
  const hasManuallySelectedRef = useRef<boolean>(false);

  // Get valid players
  const validPlayers = useMemo(() => {
    return players.filter((player) => {
      if (!player) return false;
      const hasId = (player.player_id != null && player.player_id !== undefined && player.player_id !== '') ||
                    (player.account_id != null && player.account_id !== undefined);
      return hasId;
    });
  }, [players]);

  // Auto-select all players by default (only on initial load, not after manual deselection)
  useEffect(() => {
    if (!hasManuallySelectedRef.current && selectedPlayerIds.size === 0 && validPlayers.length > 0) {
      const allPlayerIds = new Set(validPlayers.map((p) => getPlayerId(p)));
      setSelectedPlayerIds(allPlayerIds);
    }
  }, [validPlayers, selectedPlayerIds.size]);

  // Change detection logic - runs for all players
  useEffect(() => {
    if (validPlayers.length === 0) return;

    const previousPlayers = previousPlayersRef.current;
    const newChanges: Change[] = [];
    const timestamp = Date.now();

    // Process each valid player
    validPlayers.forEach((currentPlayer) => {
      const playerId = getPlayerId(currentPlayer);
      const previousPlayer = previousPlayers.get(playerId);

      // Skip if no previous state (first time seeing this player)
      if (!previousPlayer) {
        previousPlayers.set(playerId, currentPlayer);
        return;
      }

      // Calculate player stat changes
      const goldDelta = (currentPlayer.gold || 0) - (previousPlayer.gold || 0);
      const xpDelta = (currentPlayer.xp || 0) - (previousPlayer.xp || 0);
      const levelDelta = (currentPlayer.level || 0) - (previousPlayer.level || 0);
      const healthDelta = (currentPlayer.health || 0) - (previousPlayer.health || 0);

      // Safely get units arrays, defaulting to empty arrays if null/undefined
      const previousUnits = previousPlayer.units || [];
      const currentUnits = currentPlayer.units || [];

      // Create maps for efficient lookup
      const previousUnitsByEntindex = new Map<number, typeof previousUnits[0]>();
      const currentUnitsByEntindex = new Map<number, typeof currentUnits[0]>();
      
      previousUnits.forEach((unit) => {
        previousUnitsByEntindex.set(unit.entindex, unit);
      });
      
      currentUnits.forEach((unit) => {
        currentUnitsByEntindex.set(unit.entindex, unit);
      });

      // Track units by unit_id and rank for upgrade detection
      const previousUnitsByUnitIdAndRank = new Map<string, typeof previousUnits[0][]>();
      const currentUnitsByUnitIdAndRank = new Map<string, typeof currentUnits[0][]>();

      previousUnits.forEach((unit) => {
        const key = `${unit.unit_id}:${unit.rank}`;
        if (!previousUnitsByUnitIdAndRank.has(key)) {
          previousUnitsByUnitIdAndRank.set(key, []);
        }
        previousUnitsByUnitIdAndRank.get(key)!.push(unit);
      });

      currentUnits.forEach((unit) => {
        const key = `${unit.unit_id}:${unit.rank}`;
        if (!currentUnitsByUnitIdAndRank.has(key)) {
          currentUnitsByUnitIdAndRank.set(key, []);
        }
        currentUnitsByUnitIdAndRank.get(key)!.push(unit);
      });

      // Track consumed entindexes (units used in upgrades) to exclude from "sold"
      const consumedEntindexes = new Set<number>();
      // Track upgraded entindexes (result units) to exclude from "bought"
      const upgradedEntindexes = new Set<number>();

      // FIRST: Detect upgrades
      // If a unit with rank > 1 appears that wasn't there before, it's an upgrade (not a buy)
      // This works for any rank upgrade: rank 1→2, rank 2→3, etc.
      // Process from highest rank to lowest to handle cascading upgrades correctly
      const unitsByRank = currentUnits
        .filter((unit) => unit.rank > 1 && !previousUnitsByEntindex.has(unit.entindex))
        .sort((a, b) => b.rank - a.rank); // Sort descending by rank
      
      unitsByRank.forEach((unit) => {
        const previousRank = unit.rank - 1;
        const previousKey = `${unit.unit_id}:${previousRank}`;
        const previousLowerRankUnits = previousUnitsByUnitIdAndRank.get(previousKey) || [];
        
        // Check which lower-rank units disappeared (were consumed in the upgrade)
        // We'll only see 2 units disappear - the 3rd one was just bought and consumed immediately
        // Examples:
        // - Rank 1→2: 2 rank 1 units disappear, 1 rank 2 unit appears (the bought one)
        // - Rank 2→3: 2 rank 2 units disappear, 1 rank 3 unit appears (the bought one)
        // - Cascading: 2 rank 1 units disappear (1→2 upgrade), 2 rank 2 units disappear (2→3 upgrade)
        const disappearedLowerRankUnits = previousLowerRankUnits.filter(
          (prevUnit) => !currentUnitsByEntindex.has(prevUnit.entindex) && 
                       !consumedEntindexes.has(prevUnit.entindex) // Don't count units already consumed in higher-rank upgrades
        );
        
        // Need at least 2 units to have disappeared (the 3rd was the bought one that got consumed immediately)
        // The 3rd unit that was bought appears as the higher rank unit (rank 2, 3, etc.)
        if (disappearedLowerRankUnits.length >= 2) {
          // Mark this as an upgrade
          upgradedEntindexes.add(unit.entindex);
          
          // Mark the consumed units (the 2 that disappeared from the board)
          disappearedLowerRankUnits.forEach((consumedUnit) => {
            consumedEntindexes.add(consumedUnit.entindex);
          });
          
          // For cascading upgrades (e.g., rank 2→3), also check if rank 1 units of the same unit_id disappeared
          // These were consumed in the intermediate rank 1→2 upgrade that fed into the rank 2→3 upgrade
          if (previousRank > 1) {
            const rank1Key = `${unit.unit_id}:1`;
            const previousRank1Units = previousUnitsByUnitIdAndRank.get(rank1Key) || [];
            const disappearedRank1Units = previousRank1Units.filter(
              (prevUnit) => !currentUnitsByEntindex.has(prevUnit.entindex) && 
                           !consumedEntindexes.has(prevUnit.entindex)
            );
            
            // If we see rank 1 units disappearing along with rank 2 units, they're part of the cascading upgrade
            if (disappearedRank1Units.length >= 2) {
              // Mark these rank 1 units as consumed too
              disappearedRank1Units.forEach((consumedUnit) => {
                consumedEntindexes.add(consumedUnit.entindex);
              });
            }
          }
          
          // Find the consumed units' entindexes for display
          const consumedEntindexesList = disappearedLowerRankUnits.map((u) => u.entindex);
          
          newChanges.push({
            type: 'upgraded',
            player_id: playerId,
            unit_id: unit.unit_id,
            entindex: unit.entindex,
            previous_entindex: consumedEntindexesList[0], // Store first consumed entindex
            rank: unit.rank,
            previous_rank: previousRank,
            position: unit.position,
            timestamp,
          });
        }
      });

      // Detect bought: new entindex appears, but only if rank = 1
      // Rank > 1 units that appear are always upgrades (you can't buy rank > 1 units from shop)
      currentUnits.forEach((unit) => {
        // Only rank 1 units can be bought - rank > 1 are always upgrades
        if (!previousUnitsByEntindex.has(unit.entindex) && unit.rank === 1) {
          // Check if this unit_id was just upgraded (the 3rd bought unit gets consumed immediately)
          // If an upgrade was detected for this unit_id, suppress the bought event
          const wasPartOfUpgrade = Array.from(upgradedEntindexes).some((upgradedEntindex) => {
            const upgradedUnit = currentUnits.find((cu) => cu.entindex === upgradedEntindex);
            return upgradedUnit && upgradedUnit.unit_id === unit.unit_id;
          });
          
          if (!wasPartOfUpgrade) {
            newChanges.push({
              type: 'bought',
              player_id: playerId,
              unit_id: unit.unit_id,
              entindex: unit.entindex,
              rank: unit.rank,
              position: unit.position,
              timestamp,
            });
          }
        }
        // Note: We don't check for rank > 1 units here because they're always upgrades, 
        // which are already handled in the upgrade detection above
      });

      // Detect sold: entindex disappears, but exclude units consumed in upgrades
      previousUnits.forEach((unit) => {
        if (!currentUnitsByEntindex.has(unit.entindex)) {
          // Only mark as sold if it wasn't consumed in an upgrade
          if (!consumedEntindexes.has(unit.entindex)) {
            newChanges.push({
              type: 'sold',
              player_id: playerId,
              unit_id: unit.unit_id,
              entindex: unit.entindex,
              rank: unit.rank,
              previous_position: unit.position,
              timestamp,
            });
          }
        }
      });

      // Detect moved: same entindex, different position
      // Determine if position is on board (y >= 0 && y <= 3) or bench (y === -1)
      const isBoardPosition = (y: number) => y >= 0 && y <= 3;
      const isBenchPosition = (y: number) => y === -1;
      
      currentUnits.forEach((unit) => {
        const previousUnit = previousUnitsByEntindex.get(unit.entindex);
        if (previousUnit) {
          const positionChanged = 
            previousUnit.position.x !== unit.position.x ||
            previousUnit.position.y !== unit.position.y;
          
          if (positionChanged) {
            const prevOnBoard = isBoardPosition(previousUnit.position.y);
            const prevOnBench = isBenchPosition(previousUnit.position.y);
            const currOnBoard = isBoardPosition(unit.position.y);
            const currOnBench = isBenchPosition(unit.position.y);
            
            let moveType: 'benched' | 'deployed' | 'reposition' | 'organize_bench';
            
            if (prevOnBoard && currOnBoard) {
              // Board to board = reposition
              moveType = 'reposition';
            } else if (prevOnBench && currOnBench) {
              // Bench to bench = organize bench
              moveType = 'organize_bench';
            } else if (prevOnBoard && currOnBench) {
              // Board to bench = benched
              moveType = 'benched';
            } else {
              // Bench to board = deployed
              moveType = 'deployed';
            }
            
            newChanges.push({
              type: moveType,
              player_id: playerId,
              unit_id: unit.unit_id,
              entindex: unit.entindex,
              rank: unit.rank,
              position: unit.position,
              previous_position: previousUnit.position,
              timestamp,
            });
          }
        }
      });

      // Detect player changes (reroll, XP purchase, level up, HP change)
      // These should be detected after unit changes to check if units were bought/upgraded
      
      // Get changes for this player only (for reroll detection)
      const playerChanges = newChanges.filter((c) => c.player_id === playerId);
      
      // Detect reroll: Gold decreases by 2, no units were bought or upgraded
      // Check if any units were bought or upgraded (not sold/moved)
      const hasBoughtOrUpgraded = playerChanges.some(
        (change) => change.type === 'bought' || change.type === 'upgraded'
      );
      
      if (goldDelta === -2 && !hasBoughtOrUpgraded) {
        // If gold went down by 2 and no units were bought/upgraded, it's a reroll
        newChanges.push({
          type: 'reroll',
          player_id: playerId,
          gold_spent: 2,
          timestamp,
        });
      }
      
      // Detect XP purchase: Account for level ups when calculating effective XP gain
      // When buying XP causes a level up, XP resets to 0/next_level_xp
      // Formula: effectiveXpGain = xpDelta + (levelDelta * previousNextLevelXp)
      const effectiveXpGain = xpDelta + (levelDelta * (previousPlayer.next_level_xp || 0));
      
      if (effectiveXpGain === 5 && goldDelta === -5) {
        newChanges.push({
          type: 'xp_purchase',
          player_id: playerId,
          gold_spent: 5,
          xp_gained: 5,
          timestamp,
        });
      }
      
      // Detect level up: Level increases
      if (levelDelta > 0) {
        newChanges.push({
          type: 'level_up',
          player_id: playerId,
          level_before: previousPlayer.level || 0,
          level_after: currentPlayer.level || 0,
          timestamp,
        });
      }

      // Detect HP change: Health decreases (damage taken)
      if (healthDelta < 0) {
        const damageTaken = Math.abs(healthDelta);
        newChanges.push({
          type: 'hp_change',
          player_id: playerId,
          health_before: previousPlayer.health || 0,
          health_after: currentPlayer.health || 0,
          damage_taken: damageTaken,
          round_number: currentRound?.round_number,
          round_phase: currentRound?.round_phase,
          timestamp,
        });
      }

      // Update previous state for this player
      previousPlayers.set(playerId, currentPlayer);
    });

    // Add all new changes to the changes array
    if (newChanges.length > 0) {
      setChanges((prev) => [...newChanges, ...prev].slice(0, 500)); // Keep last 500 changes (increased for all players)
    }
  }, [validPlayers]);

  const handleFilterChange = (filterType: keyof typeof changeFilters) => {
    if (filterType === 'all') {
      const newValue = !changeFilters.all;
      setChangeFilters({
        all: newValue,
        bought: newValue,
        sold: newValue,
        upgraded: newValue,
        benched: newValue,
        deployed: newValue,
        reposition: newValue,
        organize_bench: newValue,
        reroll: newValue,
        xp_purchase: newValue,
        level_up: newValue,
        hp_change: newValue,
      });
    } else {
      setChangeFilters((prev) => {
        const newFilters = { ...prev, [filterType]: !prev[filterType] };
        // Update 'all' based on individual filters
        newFilters.all = newFilters.bought && newFilters.sold && newFilters.upgraded && 
                         newFilters.benched && newFilters.deployed && newFilters.reposition && newFilters.organize_bench &&
                         newFilters.reroll && newFilters.xp_purchase && 
                         newFilters.level_up && newFilters.hp_change;
        return newFilters;
      });
    }
  };

  const handlePlayerToggle = (playerId: string) => {
    hasManuallySelectedRef.current = true;
    setSelectedPlayerIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const filteredChanges = useMemo(() => {
    // First filter by selected players
    let filtered = changes.filter((change) => selectedPlayerIds.has(change.player_id));
    
    // Then filter by change type
    if (!changeFilters.all) {
      filtered = filtered.filter((change) => changeFilters[change.type]);
    }
    
    return filtered;
  }, [changes, changeFilters, selectedPlayerIds]);

  return (
    <Widget
      title="Changes"
      className="unit-changes-widget"
      storageKey={storageKey}
      dragId={dragId}
      onHeaderMouseDown={onHeaderMouseDown}
      style={{ width: '400px' }}
      minWidth={350}
      maxWidth={600}
      resizable={true}
    >
      <div className="unit-changes-widget__content">
        {/* Settings - Collapsible */}
        <SettingsSection title="Settings" defaultOpen={false}>
          <div className="unit-changes-widget__controls">
            <div className="unit-changes-widget__filter-group">
              <Text variant="label" className="unit-changes-widget__group-title">Players</Text>
              <div className="unit-changes-widget__button-group">
                <Button
                  variant={selectedPlayerIds.size === validPlayers.length && validPlayers.length > 0 ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => {
                    hasManuallySelectedRef.current = true;
                    if (selectedPlayerIds.size === validPlayers.length && validPlayers.length > 0) {
                      // All are selected, deselect all
                      setSelectedPlayerIds(new Set());
                    } else {
                      // Not all are selected, select all
                      setSelectedPlayerIds(new Set(validPlayers.map((p) => getPlayerId(p))));
                    }
                  }}
                >
                  All
                </Button>
                {validPlayers.map((player) => {
                  const playerId = getPlayerId(player);
                  const playerName = player.persona_name || player.bot_persona_name || `Player ${player.account_id}`;
                  return (
                    <Button
                      key={playerId}
                      variant={selectedPlayerIds.has(playerId) ? 'primary' : 'secondary'}
                      size="small"
                      onClick={() => handlePlayerToggle(playerId)}
                    >
                      {playerName}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Change Type Filters - Grouped */}
            <div className="unit-changes-widget__filter-group">
              <Text variant="label" className="unit-changes-widget__group-title">Unit Actions</Text>
              <div className="unit-changes-widget__button-group">
                <Button
                  variant={changeFilters.bought ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => handleFilterChange('bought')}
                >
                  Bought
                </Button>
                <Button
                  variant={changeFilters.sold ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => handleFilterChange('sold')}
                >
                  Sold
                </Button>
                <Button
                  variant={changeFilters.upgraded ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => handleFilterChange('upgraded')}
                >
                  Upgraded
                </Button>
              </div>
            </div>

            <div className="unit-changes-widget__filter-group">
              <Text variant="label" className="unit-changes-widget__group-title">Movement</Text>
              <div className="unit-changes-widget__button-group">
                <Button
                  variant={changeFilters.benched ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => handleFilterChange('benched')}
                >
                  Benched
                </Button>
                <Button
                  variant={changeFilters.deployed ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => handleFilterChange('deployed')}
                >
                  Deployed
                </Button>
                <Button
                  variant={changeFilters.reposition ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => handleFilterChange('reposition')}
                >
                  Reposition
                </Button>
                <Button
                  variant={changeFilters.organize_bench ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => handleFilterChange('organize_bench')}
                >
                  Organize Bench
                </Button>
              </div>
            </div>

            <div className="unit-changes-widget__filter-group">
              <Text variant="label" className="unit-changes-widget__group-title">Player Actions</Text>
              <div className="unit-changes-widget__button-group">
                <Button
                  variant={changeFilters.reroll ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => handleFilterChange('reroll')}
                >
                  Reroll
                </Button>
                <Button
                  variant={changeFilters.xp_purchase ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => handleFilterChange('xp_purchase')}
                >
                  XP
                </Button>
                <Button
                  variant={changeFilters.level_up ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => handleFilterChange('level_up')}
                >
                  Level Up
                </Button>
                <Button
                  variant={changeFilters.hp_change ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => handleFilterChange('hp_change')}
                >
                  HP
                </Button>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Changes List */}
        {filteredChanges.length > 0 && (
          <div className="unit-changes-widget__section">
            <Text variant="heading" className="unit-changes-widget__section-title">
              Changes ({filteredChanges.length})
            </Text>
            <div className="unit-changes-widget__changes-list">
              {filteredChanges.map((change, index) => {
                const timeAgo = Math.floor((Date.now() - change.timestamp) / 1000);
                const timeDisplay = timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`;
                
                // Get player name
                const player = validPlayers.find((p) => getPlayerId(p) === change.player_id);
                const playerName = player 
                  ? (player.persona_name || player.bot_persona_name || `Player ${player.account_id}`)
                  : `Player ${change.player_id}`;
                
                // Check if this is a unit change or player change
                const isUnitChange = ['bought', 'sold', 'upgraded', 'benched', 'deployed', 'reposition', 'organize_bench'].includes(change.type);
                
                return (
                  <div 
                    key={index} 
                    className={`unit-changes-widget__change-item unit-changes-widget__change-item--${change.type}`}
                  >
                    {/* Icon/Portrait Section */}
                    <div className="unit-changes-widget__change-icon">
                      {isUnitChange && change.unit_id && change.rank !== undefined ? (
                        <HeroPortrait
                          unitId={change.unit_id}
                          rank={change.rank}
                          heroesData={heroesData}
                        />
                      ) : change.type === 'level_up' && change.level_after !== undefined && player ? (
                        <LevelXpIndicator
                          level={change.level_after}
                          xp={player.xp || 0}
                          nextLevelXp={player.next_level_xp || 0}
                          showXpText={false}
                        />
                      ) : change.type === 'hp_change' && change.round_number !== undefined && change.round_phase ? (
                        <div className="unit-changes-widget__round-icon">
                          <Text variant="label" weight="bold" className="unit-changes-widget__round-number">
                            {change.round_number}
                          </Text>
                          <PhaseIcon phase={change.round_phase} size="small" />
                        </div>
                      ) : (
                        <div className="unit-changes-widget__player-action-icon">
                          {change.type === 'reroll' && <span className="unit-changes-widget__icon">🎲</span>}
                          {change.type === 'xp_purchase' && <span className="unit-changes-widget__icon">⭐</span>}
                        </div>
                      )}
                    </div>
                    
                    {/* Details Section */}
                    <div className="unit-changes-widget__change-details">
                      <div className="unit-changes-widget__change-meta">
                        <Text variant="label" className="unit-changes-widget__change-player">
                          {playerName}
                        </Text>
                        <span className="unit-changes-widget__change-separator">-</span>
                        <Text variant="label" className="unit-changes-widget__change-time">
                          {timeDisplay}
                        </Text>
                      </div>
                      <div className="unit-changes-widget__change-content">
                        {change.type !== 'hp_change' && (
                          <Text variant="label" className="unit-changes-widget__change-type">
                            {change.type.charAt(0).toUpperCase() + change.type.slice(1).replace('_', ' ')}
                          </Text>
                        )}
                        <div className="unit-changes-widget__change-info">
                        {change.type === 'hp_change' && change.health_before !== undefined && change.health_after !== undefined && change.damage_taken !== undefined && (
                          <div className="unit-changes-widget__hp-change-info">
                            <HealthDisplay health={change.health_before} />
                            <HealthDisplay health={-change.damage_taken} />
                            <HealthDisplay health={change.health_after} />
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Widget>
  );
};

