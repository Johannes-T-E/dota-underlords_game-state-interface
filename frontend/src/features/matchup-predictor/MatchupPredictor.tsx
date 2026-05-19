import { useEffect, useMemo, useState } from 'react';
import { EmptyState, PageHeader } from '@/components/shared';
import { Text } from '@/components/ui';
import { IconSpy } from '@tabler/icons-react';
import { ToggleSwitch } from '@/features/settings/components/ToggleSwitch/ToggleSwitch';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { useHeroesDataContext } from '@/contexts/HeroesDataContext';
import { apiService } from '@/services/api';
import { setCombatHistory } from '@/store/matchSlice';
import { setPrediction } from '@/store/matchupPredictorSlice';
import { ScoutPlayerList } from './components/ScoutPlayerList';
import { PerspectiveMatchBoard } from './components/PerspectiveMatchBoard';
import { FutureOpponentList } from './components/FutureOpponentList';
import { buildPerspectiveRows, getActivePlayers } from './utils/predictionView';
import './MatchupPredictor.css';

export const MatchupPredictor = () => {
  const dispatch = useAppDispatch();
  const { currentMatch, currentRound, players, privatePlayerAccountId, privatePlayer, combatHistory } = useAppSelector((state) => state.match);
  const { prediction } = useAppSelector((state) => state.matchupPredictor);
  const { heroesData } = useHeroesDataContext();
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [showBench, setShowBench] = useState(true);

  const activePlayers = useMemo(() => getActivePlayers(players || []), [players]);
  const placementByAccountId = useMemo(() => {
    const ranked = [...activePlayers].sort((a, b) => {
      const healthDelta = (b.health || 0) - (a.health || 0);
      if (healthDelta !== 0) return healthDelta;

      const recordDelta = ((b.wins || 0) - (b.losses || 0)) - ((a.wins || 0) - (a.losses || 0));
      if (recordDelta !== 0) return recordDelta;

      const netWorthDelta = (b.net_worth || 0) - (a.net_worth || 0);
      if (netWorthDelta !== 0) return netWorthDelta;

      return a.player_slot - b.player_slot;
    });

    return new Map(ranked.map((player, index) => [player.account_id, index + 1]));
  }, [activePlayers]);
  const playersBySlot = useMemo(
    () => new Map((players || []).map((player) => [player.player_slot, player])),
    [players]
  );

  const defaultPerspectiveAccountId = useMemo(() => {
    if (privatePlayerAccountId != null) return privatePlayerAccountId;
    if (privatePlayer?.player_slot != null) {
      return playersBySlot.get(privatePlayer.player_slot)?.account_id ?? null;
    }
    return activePlayers[0]?.account_id ?? null;
  }, [activePlayers, privatePlayer, privatePlayerAccountId, playersBySlot]);

  const perspectiveAccountId = selectedAccountId ?? defaultPerspectiveAccountId;
  const perspectivePlayer = useMemo(
    () => activePlayers.find((player) => player.account_id === perspectiveAccountId) || activePlayers[0],
    [activePlayers, perspectiveAccountId]
  );
  const futureRoundsToShow = Math.max(prediction?.future_rounds?.length ?? 1, 1);

  const perspectiveRows = useMemo(
    () => buildPerspectiveRows(perspectivePlayer, playersBySlot, prediction, currentRound, futureRoundsToShow),
    [perspectivePlayer, playersBySlot, prediction, currentRound, futureRoundsToShow]
  );
  const selectedPerspectiveRow = perspectiveRows[selectedPreviewIndex] || perspectiveRows[0];

  useEffect(() => {
    if (!currentMatch?.match_id) {
      return;
    }

    const fetchPrediction = async () => {
      try {
        const [predictionResponse, historyResponse] = await Promise.all([
          apiService.fetchMatchupPrediction(currentMatch.match_id),
          apiService.fetchCombatHistory(currentMatch.match_id),
        ]);
        dispatch(setPrediction(predictionResponse));
        dispatch(setCombatHistory(historyResponse));
      } catch (error) {
        console.error('Failed to fetch opponent forecast data:', error);
      }
    };

    fetchPrediction();
  }, [currentMatch?.match_id, dispatch]);

  useEffect(() => {
    if (selectedAccountId == null) return;
    if (!activePlayers.some((player) => player.account_id === selectedAccountId)) {
      setSelectedAccountId(null);
    }
  }, [activePlayers, selectedAccountId]);

  useEffect(() => {
    setSelectedPreviewIndex(0);
  }, [perspectivePlayer?.account_id, prediction?.alive_player_count, prediction?.round_number]);

  if (!currentMatch) {
    return (
      <EmptyState
        title="No Active Match"
        message="Waiting for GSI data from Dota Underlords..."
        showSpinner
      />
    );
  }

  if (activePlayers.length < 2) {
    return (
      <EmptyState
        title="Not Enough Active Players"
        message="Waiting for matchup-ready player state..."
      />
    );
  }

  const previewRound = selectedPerspectiveRow?.roundNumber;
  const previewOpponent = selectedPerspectiveRow?.opponent;

  return (
    <div className="matchup-predictor">
      <PageHeader
        title="Opponent Forecast"
        icon={<IconSpy size={18} stroke={1.8} />}
        centerContent={(
          <Text variant="body" color="secondary" className="matchup-predictor__round-label">
            {previewRound ? `Round ${previewRound}` : 'No prediction available'}
          </Text>
        )}
        rightContent={(
          <ToggleSwitch
            className="matchup-predictor__bench-toggle"
            checked={showBench}
            onChange={setShowBench}
            label={`Bench ${showBench ? 'On' : 'Off'}`}
          />
        )}
      />

      <div className="matchup-predictor__layout">
        <ScoutPlayerList
          players={activePlayers}
          selectedAccountId={perspectivePlayer?.account_id}
          heroesData={heroesData}
          onSelectPlayer={setSelectedAccountId}
        />

        <PerspectiveMatchBoard
          perspectivePlayer={perspectivePlayer}
          opponentPlayer={previewOpponent}
          perspectivePlacement={perspectivePlayer ? placementByAccountId.get(perspectivePlayer.account_id) : undefined}
          opponentPlacement={previewOpponent ? placementByAccountId.get(previewOpponent.account_id) : undefined}
          showBench={showBench}
          heroesData={heroesData}
        />

        <FutureOpponentList
          rows={perspectiveRows}
          selectedIndex={selectedPreviewIndex}
          perspectiveAccountId={perspectivePlayer?.account_id}
          combatHistory={combatHistory || {}}
          onSelectIndex={setSelectedPreviewIndex}
        />
      </div>
    </div>
  );
};
