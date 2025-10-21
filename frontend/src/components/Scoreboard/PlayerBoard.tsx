import { useAppDispatch } from '../../hooks/redux';
import { removePlayerBoard } from '../../store/boardSlice';
import { BoardGrid } from './BoardGrid';
import { BenchGrid } from './BenchGrid';
import { PlayerState } from '../../types';
import type { HeroesData } from '../../utils/heroHelpers';

interface PlayerBoardProps {
  player: PlayerState;
  heroesData: HeroesData | null;
}

export const PlayerBoard = ({ player, heroesData }: PlayerBoardProps) => {
  const dispatch = useAppDispatch();

  const handleClose = () => {
    dispatch(removePlayerBoard(player.player_id));
  };

  const playerName = player.persona_name || player.bot_persona_name || 'Unknown';
  const units = player.units || [];
  
  // Separate units into roster (y >= 0) and bench (y = -1)
  const rosterUnits = units.filter(unit => unit.position && unit.position.y >= 0);
  const benchUnits = units.filter(unit => unit.position && unit.position && unit.position.y === -1);

  return (
    <div className="board-wrapper" id={`board-${player.player_id}`}>
      <div className="board-header">
        <span className="board-player-name">{playerName}</span>
        <button className="board-close-btn" onClick={handleClose}>
          ×
        </button>
      </div>
      <div className="board-grid-container">
        <BoardGrid units={rosterUnits} heroesData={heroesData} />
        <BenchGrid units={benchUnits} heroesData={heroesData} />
      </div>
    </div>
  );
};
