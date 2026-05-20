const RANK_NAMES = [
  'Upstart',
  'Grifter',
  'Outlaw',
  'Enforcer',
  'Smuggler',
  'Lieutenant',
  'Boss',
  'Big Boss',
  'Lord of White Spire',
] as const;

const TIER_ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const;

export interface ParsedRankTier {
  major: number;
  sub: number;
}

/** Decode GSI rank_tier into major rank (1–9) and sub-tier (1–5, Roman I–V). */
export function parseRankTier(rankTier: number | null | undefined): ParsedRankTier | null {
  if (rankTier == null || rankTier < 0) return null;

  const major = Math.floor(rankTier / 10) + 1;
  const sub = (rankTier % 10) + 1;

  if (major < 1 || major > 9) return null;
  if (major === 9) return { major, sub: Math.min(Math.max(sub, 1), 5) };
  if (sub < 1 || sub > 5) return null;

  return { major, sub };
}

/** Display name with Roman sub-tier, e.g. "Big Boss I". */
export function formatRankTier(rankTier: number | null | undefined): string | null {
  const parsed = parseRankTier(rankTier);
  if (!parsed) return null;

  const name = RANK_NAMES[parsed.major - 1];
  if (!name) return null;
  if (parsed.major === 9) {
    return name;
  }
  return `${name} ${TIER_ROMAN[parsed.sub - 1]}`;
}

/** Compact label with Arabic sub-tier, e.g. "Big Boss 1". */
export function formatRankTierArabic(rankTier: number | null | undefined): string | null {
  const parsed = parseRankTier(rankTier);
  if (!parsed) return null;

  const name = RANK_NAMES[parsed.major - 1];
  if (!name) return null;
  if (parsed.major === 9) return name;
  return `${name} ${parsed.sub}`;
}

/** Full label; appends leaderboard # for Lords when provided. */
export function formatRankTierDisplay(
  rankTier: number | null | undefined,
  globalLeaderboardRank?: number | null
): string | null {
  const base = formatRankTier(rankTier);
  if (!base) return null;

  const parsed = parseRankTier(rankTier);
  if (parsed?.major === 9 && globalLeaderboardRank != null && globalLeaderboardRank > 0) {
    return `${base} #${globalLeaderboardRank}`;
  }
  return base;
}

/** Path to solo ranked medal pin PNG under /icons/mini_profile/. */
export function getRankPinIconPath(rankTier: number | null | undefined): string | null {
  const parsed = parseRankTier(rankTier);
  if (!parsed) return null;

  return `/icons/mini_profile/mini_profile_rank_${parsed.major}_tier_${parsed.sub}_pin_psd.png`;
}
