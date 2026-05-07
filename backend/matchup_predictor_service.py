from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .matchup_predictor import DeterministicMatchupPredictor


class MatchupPredictorService:
    MAX_FUTURE_ROUNDS = 25

    def __init__(self) -> None:
        model_path = Path(__file__).resolve().parent / "matchup_predictor" / "models.json"
        self.predictor = DeterministicMatchupPredictor.from_model_file(model_path)

    @staticmethod
    def _alive_and_eliminated_slots(match_state: Any) -> Tuple[Tuple[int, ...], Tuple[int, ...]]:
        alive: List[int] = []
        eliminated: List[int] = []
        for player in match_state.latest_processed_public_player_states.values():
            slot = player.get("player_slot")
            if slot is None:
                continue
            if player.get("final_place", 0) == 0:
                alive.append(int(slot))
            else:
                eliminated.append(int(slot))

        alive_sorted = tuple(sorted(alive))
        eliminated_sorted = tuple(sorted(eliminated))
        return alive_sorted, eliminated_sorted

    @staticmethod
    def _build_previous_structure(match_state: Any) -> Optional[Tuple[Tuple[Tuple[int, int], ...], Tuple[Any, ...]]]:
        pairs = match_state.previous_round_oriented_pairs
        if not pairs:
            return None

        normalized_pairs = tuple(sorted(tuple(pair) for pair in pairs))
        return (normalized_pairs, tuple())

    def get_current_prediction(self, match_state: Any) -> Optional[Dict[str, Any]]:
        if not match_state.match_id:
            return None

        alive_slots, eliminated_slots = self._alive_and_eliminated_slots(match_state)
        alive_count = len(alive_slots)
        if alive_count < 2:
            return None

        previous_structure = self._build_previous_structure(match_state)
        result = self.predictor.predict_matchups(
            alive_player_count=alive_count,
            current_round_number=match_state.round_number,
            schedule_offset=match_state.schedule_offset,
            alive_player_slots=alive_slots,
            previous_alive_player_count=match_state.previous_alive_player_count,
            previous_full_oriented_structure=previous_structure,
            streak_step=match_state.streak_step,
            eliminated_player_slots=eliminated_slots,
        )

        prediction_pairs = self._prediction_to_pairs(result.prediction)

        future_rounds = self._build_future_rounds(
            match_state=match_state,
            alive_slots=alive_slots,
            eliminated_slots=eliminated_slots,
            alive_count=alive_count,
            previous_structure=previous_structure,
        )

        payload = {
            "known": result.known,
            "tier": result.tier,
            "reason": result.reason,
            "prediction_pairs": prediction_pairs,
            "alive_player_count": alive_count,
            "alive_player_slots": list(alive_slots),
            "eliminated_player_slots": list(eliminated_slots),
            "round_number": match_state.round_number,
            "round_phase": match_state.round_phase,
            "schedule_offset": match_state.schedule_offset,
            "streak_step": match_state.streak_step,
            "future_rounds": future_rounds,
        }
        match_state.latest_matchup_prediction = payload
        return payload

    @staticmethod
    def _prediction_to_pairs(prediction: Any) -> List[List[int]]:
        pairs_out: List[List[int]] = []
        if prediction and isinstance(prediction, tuple) and len(prediction) > 0:
            pairs = prediction[0]
            if isinstance(pairs, tuple):
                for pair in pairs:
                    if isinstance(pair, tuple) and len(pair) == 2:
                        pairs_out.append([int(pair[0]), int(pair[1])])
        return pairs_out

    @staticmethod
    def _pairs_to_structure(pairs: List[List[int]]) -> Optional[Tuple[Tuple[Tuple[int, int], ...], Tuple[Any, ...]]]:
        if not pairs:
            return None
        frozen_pairs = tuple(sorted((int(left), int(right)) for left, right in pairs))
        return (frozen_pairs, tuple())

    def _build_future_rounds(
        self,
        *,
        match_state: Any,
        alive_slots: Tuple[int, ...],
        eliminated_slots: Tuple[int, ...],
        alive_count: int,
        previous_structure: Optional[Tuple[Tuple[Tuple[int, int], ...], Tuple[Any, ...]]],
    ) -> List[Dict[str, Any]]:
        future_rounds: List[Dict[str, Any]] = []
        prev_structure = previous_structure

        for step in range(self.MAX_FUTURE_ROUNDS):
            round_number = match_state.round_number + step
            step_streak = (match_state.streak_step or 0) + step
            result = self.predictor.predict_matchups(
                alive_player_count=alive_count,
                current_round_number=round_number,
                schedule_offset=match_state.schedule_offset,
                alive_player_slots=alive_slots,
                previous_alive_player_count=match_state.previous_alive_player_count,
                previous_full_oriented_structure=prev_structure,
                streak_step=step_streak,
                eliminated_player_slots=eliminated_slots,
            )
            pairs = self._prediction_to_pairs(result.prediction)
            future_rounds.append(
                {
                    "round_number": round_number,
                    "known": result.known,
                    "tier": result.tier,
                    "reason": result.reason,
                    "prediction_pairs": pairs,
                }
            )
            next_structure = self._pairs_to_structure(pairs)
            if next_structure is not None:
                prev_structure = next_structure

            # Dynamic horizon: keep all 25 for strict 8-player table, otherwise
            # stop once predictions become unknown/missing for this lobby state.
            if alive_count != 8 and not result.known:
                break

        return future_rounds


matchup_predictor_service = MatchupPredictorService()
