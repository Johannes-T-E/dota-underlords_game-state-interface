import { useAppSelector } from '../../../hooks/redux';
import { PlayerBoard } from '../PlayerBoard/PlayerBoard';
import { useHeroesData } from '../../../hooks/useHeroesData';
import './BoardVisualizer.css';

export const BoardVisualizer = () => {
  const { selectedPlayerIds, boardData } = useAppSelector((state) => state.board);
  const { heroesData } = useHeroesData();

  if (selectedPlayerIds.length === 0) {
    return null;
  }

  return (
    <div className="boards-container">
      {selectedPlayerIds.map((playerId) => {
        const playerData = boardData[playerId];
        if (!playerData) return null;
        
        return (
          <PlayerBoard
            key={playerId}
            player={playerData}
            heroesData={heroesData}
          />
        );
      })}
    </div>
  );
};
