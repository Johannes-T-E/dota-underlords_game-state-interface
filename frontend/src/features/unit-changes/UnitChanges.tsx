import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { apiService } from '@/services/api';
import { setChanges, selectChangesForCurrentMatch } from '@/store/changesSlice';
import type { ConnectionStatus } from '@/types';
import { ChangeFilters } from './components/ChangeFilters';
import { ChangesList } from './components/ChangesList';
import { FilterChips } from './components/FilterChips';
import type { FilterPreset } from './components/FilterPresets';
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
          const convertedChanges = response.changes.map((change: any) => ({
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

  const handleSelectAllPlayers = () => {
    hasManuallySelectedRef.current = true;
    if (selectedPlayerIds.size === validPlayers.length && validPlayers.length > 0) {
      // All are selected, deselect all
      setSelectedPlayerIds(new Set());
    } else {
      // Not all are selected, select all
      setSelectedPlayerIds(new Set(validPlayers.map((p) => p.account_id)));
    }
  };

  const handlePresetSelect = (preset: FilterPreset) => {
    setChangeFilters((prev) => ({
      ...prev,
      ...preset.filters,
      all: false // Presets disable "all" mode
    }));
  };

  const handleClearAllFilters = () => {
    setChangeFilters({
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
  };

  const handleClearAllPlayers = () => {
    hasManuallySelectedRef.current = true;
    setSelectedPlayerIds(new Set(validPlayers.map((p) => p.account_id)));
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
      <FilterChips
        validPlayers={validPlayers}
        selectedPlayerIds={selectedPlayerIds}
        onPlayerRemove={handlePlayerToggle}
        onClearAllPlayers={handleClearAllPlayers}
        changeFilters={changeFilters}
        onFilterRemove={handleFilterChange}
        onClearAllFilters={handleClearAllFilters}
      />

      <ChangeFilters
        validPlayers={validPlayers}
        selectedPlayerIds={selectedPlayerIds}
        onPlayerToggle={handlePlayerToggle}
        onSelectAllPlayers={handleSelectAllPlayers}
        changeFilters={changeFilters}
        onFilterChange={handleFilterChange}
        onPresetSelect={handlePresetSelect}
      />

      <ChangesList
        changes={filteredChanges}
        validPlayers={validPlayers}
        heroesData={heroesData}
      />
    </div>
  );
};
