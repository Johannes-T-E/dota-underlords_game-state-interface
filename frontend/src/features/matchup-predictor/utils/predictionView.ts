import type { MatchupPrediction, PlayerState, RoundInfo } from '@/types';

export interface PerspectiveRow {
  roundNumber: number;
  opponentSlot?: number;
  opponent?: PlayerState;
  known?: boolean;
}

export const getActivePlayers = (players: PlayerState[]) => {
  return [...players]
    .filter((player) => (player.final_place || 0) === 0 && (player.health ?? 0) > 0)
    .sort((a, b) => a.player_slot - b.player_slot);
};

const getOpponentSlotFromPairs = (
  predictionPairs: [number, number][],
  playerSlot?: number
) => {
  if (!playerSlot) {
    return undefined;
  }

  for (const [left, right] of predictionPairs || []) {
    if (left === playerSlot) return right;
    if (right === playerSlot) return left;
  }
  return undefined;
};

export const buildPerspectiveRows = (
  perspectivePlayer: PlayerState | undefined,
  playersBySlot: Map<number, PlayerState>,
  prediction: MatchupPrediction | null,
  currentRound: RoundInfo,
  horizon: number
): PerspectiveRow[] => {
  if (!perspectivePlayer) {
    return [];
  }

  const backendRounds = prediction?.future_rounds || [];
  const fallbackRound = currentRound.round_phase === 'combat' ? currentRound.round_number + 1 : currentRound.round_number;

  return Array.from({ length: horizon }, (_, index): PerspectiveRow => {
    const backendRound = backendRounds[index];
    const roundNumber = backendRound?.round_number ?? (fallbackRound + index);
    const pairs = backendRound?.prediction_pairs ?? [];
    const opponentSlot = getOpponentSlotFromPairs(pairs, perspectivePlayer.player_slot);
    return {
      roundNumber,
      opponentSlot,
      opponent: opponentSlot ? playersBySlot.get(opponentSlot) : undefined,
      known: backendRound?.known,
    };
  });
};
