import { Button, Text } from '../../atoms';
import { RosterGrid } from '../RosterGrid/RosterGrid';
import { BenchGrid } from '../BenchGrid/BenchGrid';
import type { PlayerState } from '../../../types';
import type { HeroesData } from '../../../utils/heroHelpers';
import './PlayerBoard.css';

export interface PlayerBoardProps {
  player: PlayerState;
  heroesData: HeroesData | null;
  onClose: () => void;
  className?: string;
}

export const PlayerBoard = ({ player, heroesData, onClose, className = '' }: PlayerBoardProps) => {
  const playerName = player.persona_name || player.bot_persona_name || 'Unknown';
  const units = player.units || [];
  
  // Separate units into roster (y >= 0) and bench (y = -1)
  const rosterUnits = units.filter(unit => unit.position && unit.position.y >= 0);
  const benchUnits = units.filter(unit => unit.position && unit.position.y === -1);

  return (
    <div className={`player-board ${className}`} id={`board-${player.player_id}`}>
      <div className="player-board__header">
        <Text variant="h3" weight="bold" className="player-board__name">
          {playerName}
        </Text>
        <Button
          variant="ghost"
          size="small"
          onClick={onClose}
          className="player-board__close-btn"
          aria-label="Close board"
        >
          ×
        </Button>
      </div>
      <div className="player-board__grid-container">
        <RosterGrid units={rosterUnits} heroesData={heroesData} />
        <BenchGrid units={benchUnits} heroesData={heroesData} />
      </div>
    </div>
  );
};

