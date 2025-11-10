import { useAppSelector } from '../../hooks/redux';
import { 
  ScoreboardTable, 
  EmptyState
} from '../../components/organisms';

export const ScoreboardContainer = () => {
  const { currentMatch, players } = useAppSelector((state) => state.match);

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
      />
    </>
  );
};

