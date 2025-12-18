import React, { useMemo, useState } from 'react';
import { Text as UIText, Button } from '@/components/ui';
import { ChangeItem } from './ChangeItem';
import type { Change } from '@/types';
import type { HeroesData } from '@/utils/heroHelpers';
import type { PlayerState } from '@/types';
import './ChangesList.css';

export type SortOption = 'time-desc' | 'time-asc' | 'player' | 'type';
export type GroupOption = 'none' | 'player' | 'type' | 'time-period';

export interface ChangesListProps {
  changes: Change[];
  validPlayers: PlayerState[];
  heroesData: HeroesData | null;
}

export const ChangesList: React.FC<ChangesListProps> = ({
  changes,
  validPlayers,
  heroesData
}) => {
  const [sortOption, setSortOption] = useState<SortOption>('time-desc');
  const [groupOption, setGroupOption] = useState<GroupOption>('none');

  // Helper function to get player name (computed at render time to avoid memory leak)
  const getPlayerName = (accountId: number): string => {
    const player = validPlayers.find((p) => p.account_id === accountId);
    return player 
      ? (player.persona_name || player.bot_persona_name || `Player ${accountId}`)
      : `Player ${accountId}`;
  };

  // Helper function to format time display (computed at render time)
  const formatTimeDisplay = (timestampMs: number): string => {
    const timeAgo = Math.floor((Date.now() - timestampMs) / 1000);
    return timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`;
  };

  // Only store minimal data in memoized array - compute player names and time displays at render time
  // This prevents recalculation when validPlayers changes (which happens 10x/second)
  const changesWithPlayerInfo = useMemo(() => {
    return changes.map((change) => {
      // Convert ISO string timestamp to number for display
      const timestampMs = typeof change.timestamp === 'string' 
        ? new Date(change.timestamp).getTime() 
        : change.timestamp;
      
      return {
        change,
        accountId: change.account_id,
        timestampMs
      };
    });
  }, [changes]); // Only depend on changes, NOT validPlayers

  const sortedChanges = useMemo(() => {
    const sorted = [...changesWithPlayerInfo];
    
    switch (sortOption) {
      case 'time-desc':
        return sorted.sort((a, b) => b.timestampMs - a.timestampMs);
      case 'time-asc':
        return sorted.sort((a, b) => a.timestampMs - b.timestampMs);
      case 'player':
        // Compute player names on-the-fly during sort to avoid storing them in memoized array
        return sorted.sort((a, b) => {
          const nameA = getPlayerName(a.accountId);
          const nameB = getPlayerName(b.accountId);
          const nameCompare = nameA.localeCompare(nameB);
          if (nameCompare !== 0) return nameCompare;
          return b.timestampMs - a.timestampMs; // Secondary sort by time
        });
      case 'type':
        return sorted.sort((a, b) => {
          const typeCompare = a.change.type.localeCompare(b.change.type);
          if (typeCompare !== 0) return typeCompare;
          return b.timestampMs - a.timestampMs; // Secondary sort by time
        });
      default:
        return sorted;
    }
  }, [changesWithPlayerInfo, sortOption, validPlayers]); // Need validPlayers for player sort

  const getTimePeriod = (timestampMs: number): string => {
    const now = Date.now();
    const diff = now - timestampMs;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `Last ${minutes}m`;
    if (hours < 24) return `Last ${hours}h`;
    return 'Older';
  };

  const groupedChanges = useMemo(() => {
    if (groupOption === 'none') {
      return { '': sortedChanges };
    }

    const groups: Record<string, typeof sortedChanges> = {};

    sortedChanges.forEach((item) => {
      let groupKey = '';
      
      switch (groupOption) {
        case 'player':
          // Compute player name on-the-fly during grouping to avoid storing in memoized array
          groupKey = getPlayerName(item.accountId);
          break;
        case 'type':
          groupKey = item.change.type.charAt(0).toUpperCase() + item.change.type.slice(1).replace(/_/g, ' ');
          break;
        case 'time-period':
          groupKey = getTimePeriod(item.timestampMs);
          break;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey]!.push(item);
    });

    return groups;
  }, [sortedChanges, groupOption, validPlayers]); // Need validPlayers for player grouping

  if (changes.length === 0) {
    return (
      <div className="unit-changes-widget__section">
        <div className="changes-list__empty">
           <UIText variant="label" className="changes-list__empty-title">
             No Changes Found
           </UIText>
           <UIText variant="body" className="changes-list__empty-message">
             No changes match your current filters. Try adjusting your filter settings to see more results.
           </UIText>
        </div>
      </div>
    );
  }

  return (
    <div className="unit-changes-widget__section">
      <div className="changes-list__header">
        <UIText variant="label" className="unit-changes-widget__section-title">
          Changes ({changes.length})
        </UIText>
      <div className="changes-list__controls">
        <div className="changes-list__sort-controls">
          <UIText variant="label" className="changes-list__sort-label">
            Sort:
          </UIText>
          <Button
            variant={sortOption === 'time-desc' ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setSortOption('time-desc')}
          >
            Newest
          </Button>
          <Button
            variant={sortOption === 'time-asc' ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setSortOption('time-asc')}
          >
            Oldest
          </Button>
          <Button
            variant={sortOption === 'player' ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setSortOption('player')}
          >
            Player
          </Button>
          <Button
            variant={sortOption === 'type' ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setSortOption('type')}
          >
            Type
          </Button>
        </div>
        <div className="changes-list__group-controls">
          <UIText variant="label" className="changes-list__sort-label">
            Group:
          </UIText>
          <Button
            variant={groupOption === 'none' ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setGroupOption('none')}
          >
            None
          </Button>
          <Button
            variant={groupOption === 'player' ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setGroupOption('player')}
          >
            Player
          </Button>
          <Button
            variant={groupOption === 'type' ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setGroupOption('type')}
          >
            Type
          </Button>
          <Button
            variant={groupOption === 'time-period' ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setGroupOption('time-period')}
          >
            Time
          </Button>
        </div>
      </div>
      </div>
      <div className="unit-changes-widget__changes-list">
        {groupOption === 'none' ? (
          sortedChanges.map(({ change, accountId, timestampMs }, index) => {
            // Compute player name and time display at render time to avoid memory leak
            const player = validPlayers.find(p => p.account_id === accountId);
            const playerName = getPlayerName(accountId);
            const timeDisplay = formatTimeDisplay(timestampMs);
            return (
            <ChangeItem
              key={`${change.account_id}-${change.timestamp}-${index}`}
              change={change}
              playerName={playerName}
              timeDisplay={timeDisplay}
              heroesData={heroesData}
              player={player}
            />
            );
          })
        ) : (
          Object.entries(groupedChanges).map(([groupKey, groupItems]) => (
            <div key={groupKey} className="changes-list__group">
              <div className="changes-list__group-header">
                <UIText variant="label" className="changes-list__group-title">
                  {groupKey}
                </UIText>
                <UIText variant="label" className="changes-list__group-count">
                  ({groupItems.length})
                </UIText>
              </div>
              <div className="changes-list__group-items">
                {groupItems.map(({ change, accountId, timestampMs }, index) => {
                  // Compute player name and time display at render time to avoid memory leak
                  const player = validPlayers.find(p => p.account_id === accountId);
                  const playerName = getPlayerName(accountId);
                  const timeDisplay = formatTimeDisplay(timestampMs);
                  return (
                  <ChangeItem
                    key={`${change.account_id}-${change.timestamp}-${index}`}
                    change={change}
                    playerName={playerName}
                    timeDisplay={timeDisplay}
                    heroesData={heroesData}
                    player={player}
                  />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

