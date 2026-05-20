import type { ScoreboardColumnConfig } from '@/types';

/** Default left-to-right column order (includes keys not shown in settings grid, e.g. `player`). */
export const DEFAULT_SCOREBOARD_COLUMN_ORDER = [
  'place',
  'player',
  'playerRank',
  'playerName',
  'level',
  'gold',
  'streak',
  'health',
  'record',
  'networth',
  'synergies',
  'roster',
  'underlord',
  'contraptions',
  'bench',
] as const;

export type ScoreboardColumnKey = Exclude<keyof ScoreboardColumnConfig, 'columnOrder'>;

/** Gear menu + settings drawer column toggles (single source of truth). */
export const SCOREBOARD_COLUMN_TOGGLES: ReadonlyArray<{
  key: ScoreboardColumnKey;
  label: string;
  /** Shown in Settings → Gameplay column grid */
  inGameplaySettings?: boolean;
  recommended?: boolean;
}> = [
  { key: 'place', label: 'Place', inGameplaySettings: true, recommended: true },
  { key: 'player', label: 'Player (Compact)' },
  { key: 'playerRank', label: 'Rank', inGameplaySettings: true, recommended: true },
  { key: 'playerName', label: 'Player Name', inGameplaySettings: true, recommended: true },
  { key: 'level', label: 'Level', inGameplaySettings: true, recommended: true },
  { key: 'gold', label: 'Gold', inGameplaySettings: true, recommended: true },
  { key: 'streak', label: 'Streak', inGameplaySettings: true },
  { key: 'health', label: 'Health', inGameplaySettings: true, recommended: true },
  { key: 'record', label: 'Win/Loss', inGameplaySettings: true, recommended: true },
  { key: 'networth', label: 'Net Worth', inGameplaySettings: true },
  { key: 'synergies', label: 'Synergies', inGameplaySettings: true, recommended: true },
  { key: 'roster', label: 'Roster', inGameplaySettings: true, recommended: true },
  { key: 'underlord', label: 'Underlord', inGameplaySettings: true },
  { key: 'contraptions', label: 'Contraptions', inGameplaySettings: true },
  { key: 'bench', label: 'Bench', inGameplaySettings: true },
];

export const GAMEPLAY_COLUMN_TOGGLES = SCOREBOARD_COLUMN_TOGGLES.filter(
  (col) => col.inGameplaySettings
);

/** Insert any keys missing from saved order (e.g. `playerRank` after older saves). */
export function normalizeColumnOrder(saved?: string[]): string[] {
  const defaults = [...DEFAULT_SCOREBOARD_COLUMN_ORDER];
  const order = saved?.length ? [...saved] : [...defaults];
  const seen = new Set(order);

  for (const key of defaults) {
    if (seen.has(key)) continue;

    const defaultIdx = defaults.indexOf(key);
    let insertAt = order.length;
    for (let i = defaultIdx - 1; i >= 0; i--) {
      const prevKey = defaults[i];
      if (!prevKey) continue;
      const prevIdx = order.indexOf(prevKey);
      if (prevIdx !== -1) {
        insertAt = prevIdx + 1;
        break;
      }
    }
    order.splice(insertAt, 0, key);
    seen.add(key);
  }

  return order;
}

export const COLUMN_PREVIEW_LABELS: Record<string, string> = {
  place: '#',
  player: 'Player',
  playerRank: 'Rank',
  playerName: 'Name',
  level: 'Lvl',
  gold: 'Gold',
  streak: 'Streak',
  health: 'HP',
  record: 'W/L',
  networth: 'NW',
  roster: 'Roster',
  underlord: 'UL',
  contraptions: 'Trap',
  bench: 'Bench',
  synergies: 'Syn',
};
