import type { ApiMatch } from '@/types';

export interface MatchQualitySummary {
  totalPlayers: number;
  knownPlayers: number;
  humanCount: number;
  botCount: number;
  playerType: 'bot' | 'mixed' | 'human';
  botHeavy: boolean;
  complete: boolean;
  partial: boolean;
}

const isValidFinalPlace = (value: number) => value >= 1 && value <= 8;

export const getMatchQualitySummary = (match: ApiMatch): MatchQualitySummary => {
  const players = match.players || [];
  const knownPlayers = players.length;
  const totalPlayers = match.player_count || knownPlayers;
  const humanCount = players.filter((p) => !p.bot_persona_name).length;
  const botCount = players.filter((p) => Boolean(p.bot_persona_name)).length;
  const placedCount = players.filter((p) => isValidFinalPlace(p.final_place)).length;

  const complete = totalPlayers > 0 && knownPlayers === totalPlayers && placedCount === totalPlayers;

  let playerType: MatchQualitySummary['playerType'] = 'mixed';
  if (humanCount < 2) {
    playerType = 'bot';
  } else if (humanCount > 6) {
    playerType = 'human';
  }

  return {
    totalPlayers,
    knownPlayers,
    humanCount,
    botCount,
    playerType,
    botHeavy: totalPlayers > 0 && botCount > totalPlayers / 2,
    complete,
    partial: !complete,
  };
};
