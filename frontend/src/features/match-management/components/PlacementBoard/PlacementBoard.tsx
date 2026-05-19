import { useMemo, useState, type CSSProperties } from 'react';
import { Text } from '@/components/ui';
import { ScoreboardHeader } from '@/features/scoreboard/components/ScoreboardHeader/ScoreboardHeader';
import { ScoreboardPlayerRow } from '@/features/scoreboard/components/ScoreboardPlayerRow/ScoreboardPlayerRow';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { isSynergyActive } from '@/components/ui/SynergyDisplay/utils';
import type { MatchSummary, PlayerState, ScoreboardColumnConfig } from '@/types';
import './PlacementBoard.css';

export interface PlacementPlayer {
  account_id: number;
  persona_name?: string;
  bot_persona_name?: string;
  final_place: number;
  match_count?: number;
}

export interface PlacementBoardProps {
  players: PlacementPlayer[];
  summary?: MatchSummary | null;
  summaryLoading?: boolean;
  summaryError?: string | null;
  className?: string;
}

export const PlacementBoard = ({
  players,
  summary,
  summaryLoading = false,
  summaryError = null,
  className = ''
}: PlacementBoardProps) => {
  const SCOREBOARD_SCALE = 0.67;
  const { heroesData } = useHeroesDataContext();
  const [sortField] = useState<'health' | 'record' | 'networth'>('health');
  const [sortDirection] = useState<'asc' | 'desc'>('desc');

  const visibleColumns: ScoreboardColumnConfig = {
    place: true,
    player: false,
    playerName: true,
    level: true,
    gold: true,
    streak: true,
    health: true,
    record: true,
    networth: true,
    roster: true,
    underlord: false,
    contraptions: false,
    bench: true,
    synergies: true
  };
  const columnOrder = ['place', 'playerName', 'level', 'gold', 'streak', 'health', 'record', 'networth', 'synergies', 'roster', 'bench'];

  const fallbackByAccount = useMemo(
    () => new Map(players.map((p) => [p.account_id, p])),
    [players]
  );

  const scoreboardPlayers: PlayerState[] = useMemo(() => {
    if (!summary) return [];
    return summary.players.map((player) => {
      const fallback = fallbackByAccount.get(player.account_id);
      return {
        account_id: player.account_id,
        persona_name: player.persona_name || fallback?.persona_name,
        bot_persona_name: player.bot_persona_name || fallback?.bot_persona_name,
        player_slot: 0,
        is_human_player: !player.is_bot,
        health: player.health ?? 0,
        gold: player.gold ?? 0,
        level: player.level ?? 0,
        xp: player.xp ?? 0,
        next_level_xp: player.next_level_xp ?? 1,
        wins: player.wins ?? 0,
        losses: player.losses ?? 0,
        win_streak: player.win_streak ?? 0,
        lose_streak: player.lose_streak ?? 0,
        net_worth: player.net_worth ?? 0,
        final_place: player.final_place ?? 0,
        combat_type: 0,
        combat_result: 0,
        combat_duration: 0,
        board_unit_limit: 0,
        units: player.units || [],
        item_slots: player.item_slots || [],
        synergies: player.synergies || [],
        underlord: 0,
        underlord_selected_talents: [],
        event_tier: 0,
        owns_event: false,
        is_mirrored_match: false,
        connection_status: 0,
        disconnected_time: 0,
        vs_opponent_wins: 0,
        vs_opponent_losses: 0,
        vs_opponent_draws: 0,
        brawny_kills_float: 0,
        city_prestige_level: 0,
        platform: 0,
        board_buddy: {},
        lobby_team: 0,
        sequence_number: 0,
        timestamp: '',
        round_number: 0,
        round_phase: 'prep',
      };
    });
  }, [summary, fallbackByAccount]);

  const sortedPlayers = useMemo(() => {
    const sorted = [...scoreboardPlayers];
    sorted.sort((a, b) => {
      const aDone = (a.final_place || 0) > 0;
      const bDone = (b.final_place || 0) > 0;
      if (aDone && bDone) return (a.final_place || 0) - (b.final_place || 0);
      if (aDone) return 1;
      if (bDone) return -1;

      let aVal = 0;
      let bVal = 0;
      if (sortField === 'health') {
        aVal = a.health || 0;
        bVal = b.health || 0;
      } else if (sortField === 'record') {
        aVal = (a.wins || 0) - (a.losses || 0);
        bVal = (b.wins || 0) - (b.losses || 0);
      } else {
        aVal = a.net_worth || 0;
        bVal = b.net_worth || 0;
      }
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
    return sorted;
  }, [scoreboardPlayers, sortDirection, sortField]);

  const synergiesColumnWidth = useMemo(() => {
    const maxActiveSynergies = scoreboardPlayers.reduce((max, player) => {
      const activeSynergies = (player.synergies || []).filter((s) => isSynergyActive(s));
      return Math.max(max, activeSynergies.length);
    }, 0);

    const rowHeight = 80; // base scoreboard row height before scaling
    const slotWidth = rowHeight; // showSynergyPips is false, so icon-only width
    const gap = 4;
    const minWidth = rowHeight;

    if (maxActiveSynergies === 0) {
      return minWidth;
    }

    return maxActiveSynergies * slotWidth + (maxActiveSynergies - 1) * gap;
  }, [scoreboardPlayers]);

  return (
    <div className={`placement-board scoreboard-table ${className}`}>
      {summaryLoading && <Text className="placement-board__status-cell">Loading summary...</Text>}
      {!summaryLoading && summaryError && (
        <Text className="placement-board__status-cell placement-board__status-cell--error">{summaryError}</Text>
      )}
      {!summaryLoading && !summaryError && summary && (
        <div className="placement-board__scroll app-scrollbar">
          <div
            className="placement-board__scaled"
            style={{
              '--placement-board-scale': SCOREBOARD_SCALE,
              '--width-synergies-dynamic': `${synergiesColumnWidth}px`,
            } as CSSProperties}
          >
            <ScoreboardHeader
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={() => {}}
              visibleColumns={visibleColumns}
              columnOrder={columnOrder}
            />
            <div className="placement-board__players">
              {sortedPlayers.map((player, index) => (
                <ScoreboardPlayerRow
                  key={player.account_id}
                  player={player}
                  rank={(player.final_place || 0) > 0 ? player.final_place : index + 1}
                  heroesData={heroesData}
                  visibleColumns={visibleColumns}
                  columnOrder={columnOrder}
                  selectedUnitIds={new Set<number>()}
                  selectedSynergyKeyword={null}
                  showSynergyPips={false}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

