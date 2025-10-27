import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { togglePlayerBoard, updateBoardData } from '../../store/boardSlice';
import { useHeroesData } from '../../hooks/useHeroesData';
import { 
  ScoreboardTable, 
  BoardVisualizer, 
  EmptyState 
} from '../../components/organisms';
import type { PlayerState } from '../../types';

export const ScoreboardContainer = () => {
  const dispatch = useAppDispatch();
  const { currentMatch, players } = useAppSelector((state) => state.match);
  const { selectedPlayerIds, boardData } = useAppSelector((state) => state.board);
  const { heroesData } = useHeroesData();

  const handlePlayerSelect = (playerId: string) => {
    const player = players.find(p => p.player_id === playerId);
    if (player) {
      dispatch(togglePlayerBoard({ playerId, playerData: player }));
    }
  };

  const handlePlayerDataUpdate = (playerId: string, playerData: PlayerState) => {
    dispatch(updateBoardData({ playerId, playerData }));
  };

  const handlePlayerClose = (playerId: string) => {
    const player = players.find(p => p.player_id === playerId);
    if (player) {
      dispatch(togglePlayerBoard({ playerId, playerData: player }));
    }
  };

  if (!currentMatch) {
    return (
      <EmptyState
        title="No Active Match"
        message="Waiting for GSI data from Dota Underlords..."
        showSpinner
      />
    );
  }

  return (
    <>
      <ScoreboardTable
        players={players}
        selectedPlayerIds={selectedPlayerIds}
        onPlayerSelect={handlePlayerSelect}
        onPlayerDataUpdate={handlePlayerDataUpdate}
      />

      <BoardVisualizer
        selectedPlayers={boardData}
        heroesData={heroesData}
        onPlayerClose={handlePlayerClose}
      />
    </>
  );
};

