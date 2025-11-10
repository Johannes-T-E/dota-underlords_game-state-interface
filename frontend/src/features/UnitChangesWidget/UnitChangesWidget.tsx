import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Widget } from '../../components/widgets/Widget';
import { Text, PhaseIcon, Button } from '../../components/atoms';
import { HeroPortrait, HealthDisplay, LevelXpIndicator, SettingsSection } from '../../components/molecules';
import { useAppSelector } from '../../hooks/redux';
import { useHeroesData } from '../../hooks/useHeroesData';
import { apiService } from '../../services/api';
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
  const { players, currentMatch } = useAppSelector((state) => state.match);
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
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(false);
  const hasManuallySelectedRef = useRef<boolean>(false);
  const queuedChangesRef = useRef<Change[]>([]);

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

  // Historical data fetching - runs when component mounts or match_id changes
  useEffect(() => {
    if (!currentMatch?.match_id) {
      setChanges([]);
      return;
    }

    const fetchChanges = async () => {
      setLoading(true);
      try {
        // Get selected player account IDs if filtering
        const accountIds = selectedPlayerIds.size > 0 && selectedPlayerIds.size < validPlayers.length
          ? validPlayers
              .filter((p) => selectedPlayerIds.has(getPlayerId(p)))
              .map((p) => p.account_id)
          : undefined;

        const response = await apiService.getMatchChanges(currentMatch.match_id, accountIds?.[0], undefined);
        
        if (response.status === 'success') {
          // Convert backend timestamp (ISO string) to frontend format (milliseconds)
          const convertedChanges: Change[] = response.changes.map((change: any) => ({
            ...change,
            timestamp: new Date(change.timestamp).getTime(),
          }));

          // Merge with any queued changes and deduplicate
          const allChanges = [...convertedChanges, ...queuedChangesRef.current];
          const uniqueChanges = deduplicateChanges(allChanges);
          
          setChanges(uniqueChanges);
          queuedChangesRef.current = [];
        }
      } catch (error) {
        console.error('[UnitChangesWidget] Failed to fetch changes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChanges();
  }, [currentMatch?.match_id, selectedPlayerIds, validPlayers]);

  // Real-time WebSocket listener
  useEffect(() => {
    const handlePlayerChanges = (event: CustomEvent) => {
      const { match_id, account_id, changes: newChanges, timestamp } = event.detail;
      
      // Filter by current match_id
      if (currentMatch?.match_id !== match_id) {
        return;
      }

      // Convert backend timestamp to frontend format
      const convertedChanges: Change[] = newChanges.map((change: any) => ({
        ...change,
        timestamp: new Date(timestamp).getTime(),
      }));

      // If we're still loading historical data, queue these changes
      if (loading) {
        queuedChangesRef.current.push(...convertedChanges);
        return;
      }

      // Merge new changes into existing changes and deduplicate
      setChanges((prev) => {
        const allChanges = [...convertedChanges, ...prev];
        return deduplicateChanges(allChanges);
      });
    };

    window.addEventListener('player_changes' as any, handlePlayerChanges as EventListener);
    
    return () => {
      window.removeEventListener('player_changes' as any, handlePlayerChanges as EventListener);
    };
  }, [currentMatch?.match_id, loading]);

  // Helper function to deduplicate changes
  const deduplicateChanges = (changes: Change[]): Change[] => {
    const seen = new Set<string>();
    return changes.filter((change) => {
      // Create unique key: timestamp + player_id + change type + unit_id/item_id/synergy_keyword
      const key = `${change.timestamp}-${change.player_id}-${change.type}-${
        change.unit_id ?? change.item_id ?? change.synergy_keyword ?? ''
      }`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

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
                const timeAgo = Math.floor((Date.now() - change.timestamp) / 1000);
                const timeDisplay = timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`;
                
                // Get player name
                const player = validPlayers.find((p) => getPlayerId(p) === change.player_id);
                const playerName = player 
                  ? (player.persona_name || player.bot_persona_name || `Player ${player.account_id}`)
                  : `Player ${change.player_id}`;
                
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
    </Widget>
  );
};

