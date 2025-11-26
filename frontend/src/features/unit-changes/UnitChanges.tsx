import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Text, PhaseIcon, Button, HeroPortrait, HealthDisplay, LevelXpIndicator } from '@/components/ui';
import { SettingsSection } from '@/features/settings/components/SettingsSection/SettingsSection';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { apiService } from '@/services/api';
import { setChanges, selectChangesForCurrentMatch } from '@/store/changesSlice';
import type { Change, ConnectionStatus } from '@/types';
import './UnitChangesWidget.css';

export const UnitChanges = () => {
  const dispatch = useAppDispatch();
  const { heroesData } = useHeroesDataContext();
  const { players, currentMatch } = useAppSelector((state) => state.match);
  const connectionStatus = useAppSelector((state) => state.connection.status);
  // Frontend is stateless - only stores changes for current active match in Redux
  const changes = useAppSelector(selectChangesForCurrentMatch);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<number>>(new Set());
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
    item_added: boolean;
    item_assigned: boolean;
    item_unassigned: boolean;
    item_reassigned: boolean;
    synergy_added: boolean;
    synergy_removed: boolean;
    synergy_level_changed: boolean;
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
    item_added: true,
    item_assigned: true,
    item_unassigned: true,
    item_reassigned: true,
    synergy_added: true,
    synergy_removed: true,
    synergy_level_changed: true,
  });
  const hasManuallySelectedRef = useRef<boolean>(false);
  const previousConnectionStatusRef = useRef<ConnectionStatus | null>(null);

  // Get valid players
  const validPlayers = useMemo(() => {
    if (!players || !Array.isArray(players)) {
      return [];
    }
    return players.filter((player) => {
      if (!player) return false;
      return player.account_id != null && player.account_id !== undefined;
    });
  }, [players]);

  // Auto-select all players by default (only on initial load, not after manual deselection)
  useEffect(() => {
    if (!hasManuallySelectedRef.current && selectedPlayerIds.size === 0 && validPlayers.length > 0) {
      const allPlayerIds = new Set(validPlayers.map((p) => p.account_id));
      setSelectedPlayerIds(allPlayerIds);
    }
  }, [validPlayers, selectedPlayerIds.size]);

  // API fetching - only when necessary:
  // 1. Component mounts and WebSocket is not connected (for active match)
  // 2. Match ID changes and WebSocket is not connected (for active match)
  // 3. WebSocket reconnects (to catch up on missed changes for active match)
  useEffect(() => {
    if (!currentMatch?.match_id) {
      return;
    }

    // Determine if we need to fetch from API
    const isWebSocketConnected = connectionStatus === 'connected';
    const wasDisconnected = previousConnectionStatusRef.current === 'disconnected' || previousConnectionStatusRef.current === 'error';
    const justReconnected = wasDisconnected && isWebSocketConnected;
    
    // For active match: Fetch if WebSocket is not connected or just reconnected
    // Frontend is stateless - only store in Redux for current active match
    const shouldFetchFromAPI = !isWebSocketConnected || justReconnected;

    // Update previous connection status
    previousConnectionStatusRef.current = connectionStatus;

    if (!shouldFetchFromAPI) {
      // WebSocket is connected and wasn't just reconnected, changes will come via WebSocket -> Redux
      return;
    }

    const fetchChanges = async () => {
      try {
        const response = await apiService.getMatchChanges(currentMatch.match_id, undefined, undefined);
        
        if (response.status === 'success') {
          // Backend sends changes with ISO string timestamps - keep as string in type
          const convertedChanges: Change[] = response.changes.map((change: any) => ({
            ...change,
            // Keep timestamp as string to match backend type
            timestamp: change.timestamp,
          }));

          // Only store in Redux for current active match
          // Frontend is stateless - backend is source of truth for historical data
          dispatch(setChanges(convertedChanges));
        }
      } catch (error) {
        console.error('[UnitChanges] Failed to fetch changes:', error);
      }
    };

    fetchChanges();
  }, [currentMatch?.match_id, connectionStatus, dispatch]);

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
        item_added: newValue,
        item_assigned: newValue,
        item_unassigned: newValue,
        item_reassigned: newValue,
        synergy_added: newValue,
        synergy_removed: newValue,
        synergy_level_changed: newValue,
      });
    } else {
      setChangeFilters((prev) => {
        const newFilters = { ...prev, [filterType]: !prev[filterType] };
        // Update 'all' based on individual filters
        newFilters.all = newFilters.bought && newFilters.sold && newFilters.upgraded && 
                         newFilters.benched && newFilters.deployed && newFilters.reposition && newFilters.organize_bench &&
                         newFilters.reroll && newFilters.xp_purchase && 
                         newFilters.level_up && newFilters.hp_change &&
                         newFilters.item_added && newFilters.item_assigned && newFilters.item_unassigned && newFilters.item_reassigned &&
                         newFilters.synergy_added && newFilters.synergy_removed && newFilters.synergy_level_changed;
        return newFilters;
      });
    }
  };

  const handlePlayerToggle = (accountId: number) => {
    hasManuallySelectedRef.current = true;
    setSelectedPlayerIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const filteredChanges = useMemo(() => {
    // First filter by selected players
    let filtered = changes.filter((change) => selectedPlayerIds.has(change.account_id));
    
    // Then filter by change type
    if (!changeFilters.all) {
      filtered = filtered.filter((change) => changeFilters[change.type]);
    }
    
    return filtered;
  }, [changes, changeFilters, selectedPlayerIds]);

  return (
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
                    setSelectedPlayerIds(new Set(validPlayers.map((p) => p.account_id)));
                  }
                }}
              >
                All
              </Button>
              {validPlayers.map((player) => {
                const playerName = player.persona_name || player.bot_persona_name || `Player ${player.account_id}`;
                return (
                  <Button
                    key={player.account_id}
                    variant={selectedPlayerIds.has(player.account_id) ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => handlePlayerToggle(player.account_id)}
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

          <div className="unit-changes-widget__filter-group">
            <Text variant="label" className="unit-changes-widget__group-title">Items</Text>
            <div className="unit-changes-widget__button-group">
              <Button
                variant={changeFilters.item_added ? 'primary' : 'secondary'}
                size="small"
                onClick={() => handleFilterChange('item_added')}
              >
                Added
              </Button>
              <Button
                variant={changeFilters.item_assigned ? 'primary' : 'secondary'}
                size="small"
                onClick={() => handleFilterChange('item_assigned')}
              >
                Assigned
              </Button>
              <Button
                variant={changeFilters.item_unassigned ? 'primary' : 'secondary'}
                size="small"
                onClick={() => handleFilterChange('item_unassigned')}
              >
                Unassigned
              </Button>
              <Button
                variant={changeFilters.item_reassigned ? 'primary' : 'secondary'}
                size="small"
                onClick={() => handleFilterChange('item_reassigned')}
              >
                Reassigned
              </Button>
            </div>
          </div>

          <div className="unit-changes-widget__filter-group">
            <Text variant="label" className="unit-changes-widget__group-title">Synergies</Text>
            <div className="unit-changes-widget__button-group">
              <Button
                variant={changeFilters.synergy_added ? 'primary' : 'secondary'}
                size="small"
                onClick={() => handleFilterChange('synergy_added')}
              >
                Added
              </Button>
              <Button
                variant={changeFilters.synergy_removed ? 'primary' : 'secondary'}
                size="small"
                onClick={() => handleFilterChange('synergy_removed')}
              >
                Removed
              </Button>
              <Button
                variant={changeFilters.synergy_level_changed ? 'primary' : 'secondary'}
                size="small"
                onClick={() => handleFilterChange('synergy_level_changed')}
              >
                Level Changed
              </Button>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Changes List */}
      {filteredChanges.length > 0 && (
        <div className="unit-changes-widget__section">
          <Text variant="label" className="unit-changes-widget__section-title">
            Changes ({filteredChanges.length})
          </Text>
          <div className="unit-changes-widget__changes-list">
            {filteredChanges.map((change, index) => {
              // Convert ISO string timestamp to number for display
              const timestampMs = typeof change.timestamp === 'string' 
                ? new Date(change.timestamp).getTime() 
                : change.timestamp;
              const timeAgo = Math.floor((Date.now() - timestampMs) / 1000);
              const timeDisplay = timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`;
              
              // Get player name
              const player = validPlayers.find((p) => p.account_id === change.account_id);
              const playerName = player 
                ? (player.persona_name || player.bot_persona_name || `Player ${player.account_id}`)
                : `Player ${change.account_id}`;
              
              // Check if this is a unit change, item change, or synergy change
              const isUnitChange = ['bought', 'sold', 'upgraded', 'benched', 'deployed', 'reposition', 'organize_bench'].includes(change.type);
              const isItemChange = ['item_added', 'item_assigned', 'item_unassigned', 'item_reassigned'].includes(change.type);
              const isSynergyChange = ['synergy_added', 'synergy_removed', 'synergy_level_changed'].includes(change.type);
              
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
                    ) : isItemChange ? (
                      <div className="unit-changes-widget__item-icon">
                        <span className="unit-changes-widget__icon">📦</span>
                      </div>
                    ) : isSynergyChange ? (
                      <div className="unit-changes-widget__synergy-icon">
                        <span className="unit-changes-widget__icon">⚡</span>
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
                          {change.type.charAt(0).toUpperCase() + change.type.slice(1).replace(/_/g, ' ')}
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
                      {isItemChange && (
                        <div className="unit-changes-widget__item-change-info">
                          {change.item_id && (
                            <Text variant="label" className="unit-changes-widget__item-id">
                              Item {change.item_id}
                            </Text>
                          )}
                          {change.type === 'item_assigned' && change.assigned_unit_entindex !== null && change.assigned_unit_entindex !== undefined && (
                            <Text variant="label" className="unit-changes-widget__item-assignment">
                              → Unit {change.assigned_unit_entindex}
                            </Text>
                          )}
                          {change.type === 'item_unassigned' && change.previous_assigned_unit_entindex !== null && change.previous_assigned_unit_entindex !== undefined && (
                            <Text variant="label" className="unit-changes-widget__item-assignment">
                              ← Unit {change.previous_assigned_unit_entindex}
                            </Text>
                          )}
                          {change.type === 'item_reassigned' && change.previous_assigned_unit_entindex !== null && change.new_assigned_unit_entindex !== undefined && (
                            <Text variant="label" className="unit-changes-widget__item-assignment">
                              Unit {change.previous_assigned_unit_entindex} → {change.new_assigned_unit_entindex}
                            </Text>
                          )}
                        </div>
                      )}
                      {isSynergyChange && (
                        <div className="unit-changes-widget__synergy-change-info">
                          {change.synergy_keyword && (
                            <Text variant="label" className="unit-changes-widget__synergy-keyword">
                              Synergy {change.synergy_keyword}
                            </Text>
                          )}
                          {change.type === 'synergy_level_changed' && change.level_before !== undefined && change.level_after !== undefined && (
                            <Text variant="label" className="unit-changes-widget__synergy-level">
                              Level {change.level_before} → {change.level_after}
                            </Text>
                          )}
                          {change.type === 'synergy_added' && change.unique_unit_count !== undefined && (
                            <Text variant="label" className="unit-changes-widget__synergy-level">
                              Level {change.unique_unit_count}
                            </Text>
                          )}
                          {change.type === 'synergy_removed' && change.unique_unit_count !== undefined && (
                            <Text variant="label" className="unit-changes-widget__synergy-level">
                              Was Level {change.unique_unit_count}
                            </Text>
                          )}
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
  );
};

