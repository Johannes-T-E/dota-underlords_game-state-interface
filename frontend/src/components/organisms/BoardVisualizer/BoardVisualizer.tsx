import { PlayerBoard } from '../PlayerBoard/PlayerBoard';
import type { PlayerState } from '../../../types';
import type { HeroesData } from '../../../utils/heroHelpers';
import './BoardVisualizer.css';

export interface BoardVisualizerProps {
  selectedPlayers: { [playerId: string]: PlayerState };
  heroesData: HeroesData | null;
  onPlayerClose: (playerId: string) => void;
  className?: string;
}

export const BoardVisualizer = ({ 
  selectedPlayers, 
  heroesData, 
  onPlayerClose,
  className = ''
}: BoardVisualizerProps) => {
  const playerIds = Object.keys(selectedPlayers);

  if (playerIds.length === 0) {
    return null;
  }

  return (
    <div className={`board-visualizer ${className}`}>
      {playerIds.map((playerId) => {
        const playerData = selectedPlayers[playerId];
        if (!playerData) return null;
        
        return (
          <PlayerBoard
            key={playerId}
            player={playerData}
            heroesData={heroesData}
            onClose={() => onPlayerClose(playerId)}
          />
        );
      })}
    </div>
  );
};

