from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

Signature = Any

DEFAULT_TABLE8: Dict[str, Signature] = {
    "1": [(5, 1), (2, 6), (8, 3), (4, 7)],
    "2": [(1, 7), (2, 8), (4, 3), (5, 6)],
    "3": [(8, 1), (3, 2), (4, 6), (7, 5)],
    "4": [(6, 1), (4, 2), (7, 3), (5, 8)],
    "5": [(1, 2), (5, 3), (8, 4), (6, 7)],
    "6": [(1, 4), (7, 2), (3, 8), (5, 6)],
    "7": [(1, 5), (2, 4), (6, 3), (8, 7)],
    "8": [(1, 6), (2, 8), (7, 3), (4, 5)],
    "9": [(1, 3), (5, 2), (4, 7), (6, 8)],
    "10": [(2, 1), (4, 3), (8, 5), (6, 7)],
    "11": [(1, 6), (7, 2), (8, 3), (4, 5)],
    "12": [(7, 1), (6, 2), (3, 5), (4, 8)],
    "13": [(4, 1), (8, 2), (6, 3), (5, 7)],
    "14": [(1, 7), (2, 4), (5, 3), (8, 6)],
    "15": [(1, 3), (5, 2), (6, 4), (8, 7)],
    "16": [(1, 4), (3, 2), (5, 7), (8, 6)],
    "17": [(1, 8), (7, 2), (3, 4), (6, 5)],
    "18": [(3, 1), (2, 6), (7, 4), (8, 5)],
    "19": [(8, 1), (5, 2), (3, 7), (6, 4)],
    "20": [(2, 1), (5, 3), (8, 4), (7, 6)],
    "21": [(1, 5), (2, 3), (4, 7), (8, 6)],
    "22": [(1, 4), (5, 2), (6, 3), (8, 7)],
    "23": [(1, 7), (2, 6), (3, 4), (5, 8)],
    "24": [(5, 1), (2, 4), (3, 8), (6, 7)],
    "25": [(1, 3), (7, 2), (5, 4), (6, 8)],
}


@dataclass
class PredictionResult:
    known: bool
    prediction: Optional[Signature]
    tier: str
    reason: str
    key_used: Optional[Tuple[Any, ...]] = None


def round_index(round_number: int, offset: int, cycle_length: int = 25) -> int:
    return ((round_number - 1 + offset) % cycle_length) + 1


class DeterministicMatchupPredictor:
    def __init__(self, models: Dict[str, Dict[str, Signature]]):
        normalized = {
            name: {k: self._freeze_signature(v) for k, v in table.items()}
            for name, table in models.items()
        }
        self.models = {"table8": dict(DEFAULT_TABLE8), **normalized}

    @staticmethod
    def serialize_key(*parts: Any) -> str:
        return json.dumps(parts, sort_keys=True, separators=(",", ":"), default=str)

    @staticmethod
    def _to_full_oriented_structure(oriented_pairs: Signature) -> Signature:
        pairs = tuple(tuple(pair) for pair in oriented_pairs)
        return (tuple(sorted(pairs)), tuple())

    @staticmethod
    def _freeze_signature(value: Any) -> Any:
        if isinstance(value, list):
            return tuple(DeterministicMatchupPredictor._freeze_signature(v) for v in value)
        if isinstance(value, dict):
            return {k: DeterministicMatchupPredictor._freeze_signature(v) for k, v in value.items()}
        return value

    @classmethod
    def from_model_file(cls, path: str | Path) -> "DeterministicMatchupPredictor":
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("Model file must contain a JSON object.")
        return cls(models=payload)

    def predict_matchups(
        self,
        *,
        alive_player_count: int,
        current_round_number: int,
        schedule_offset: int,
        alive_player_slots: Tuple[int, ...],
        previous_alive_player_count: Optional[int] = None,
        previous_full_oriented_structure: Optional[Signature] = None,
        streak_step: Optional[int] = None,
        eliminated_player_slots: Optional[Tuple[int, ...]] = None,
    ) -> PredictionResult:
        if alive_player_count == 8:
            schedule_index = round_index(current_round_number, schedule_offset)
            pred = self.models.get("table8", {}).get(str(schedule_index))
            if pred is None:
                return PredictionResult(False, None, "strict_8", f"missing_8_table_index:{schedule_index}", (schedule_index,))
            return PredictionResult(True, self._to_full_oriented_structure(pred), "strict_8", "ok", (schedule_index,))

        is_entry = previous_alive_player_count is not None and previous_alive_player_count > alive_player_count
        schedule_index = round_index(current_round_number, schedule_offset)

        if alive_player_count == 7:
            if is_entry:
                key = self.serialize_key(tuple(alive_player_slots), previous_full_oriented_structure)
                pred = self.models.get("entry7", {}).get(key)
                if pred is None:
                    return PredictionResult(False, None, "entry7", "missing_entry7_key", (tuple(alive_player_slots), previous_full_oriented_structure))
                return PredictionResult(True, pred, "entry7", "ok", (tuple(alive_player_slots), previous_full_oriented_structure))
            key = self.serialize_key(previous_full_oriented_structure, schedule_index)
            pred = self.models.get("trans7", {}).get(key)
            if pred is None:
                return PredictionResult(False, None, "trans7", "missing_trans7_key", (previous_full_oriented_structure, schedule_index))
            return PredictionResult(True, pred, "trans7", "ok", (previous_full_oriented_structure, schedule_index))

        if alive_player_count == 6:
            if is_entry:
                key = self.serialize_key(tuple(alive_player_slots), previous_full_oriented_structure)
                pred = self.models.get("entry6", {}).get(key)
                if pred is None:
                    return PredictionResult(False, None, "entry6", "missing_entry6_key", (tuple(alive_player_slots), previous_full_oriented_structure))
                return PredictionResult(True, pred, "entry6", "ok", (tuple(alive_player_slots), previous_full_oriented_structure))
            key = self.serialize_key(previous_full_oriented_structure, int(streak_step or 0))
            pred = self.models.get("trans6", {}).get(key)
            if pred is None:
                return PredictionResult(False, None, "trans6", "missing_trans6_key", (previous_full_oriented_structure, int(streak_step or 0)))
            return PredictionResult(True, pred, "trans6", "ok", (previous_full_oriented_structure, int(streak_step or 0)))

        if 2 <= alive_player_count <= 5:
            if is_entry and previous_alive_player_count is not None:
                entry_key = self.serialize_key(
                    previous_alive_player_count,
                    alive_player_count,
                    tuple(alive_player_slots),
                    previous_full_oriented_structure,
                    schedule_index,
                    tuple(eliminated_player_slots or ()),
                )
                pred = self.models.get("entry_other", {}).get(entry_key)
                if pred is not None:
                    return PredictionResult(True, pred, "entry_other", "ok", (entry_key,))

                b1 = self.models.get("entry_b1", {}).get(entry_key)
                if b1 is not None:
                    return PredictionResult(True, b1, "entry_b1", "ok", (entry_key,))

                entry_key_b2 = self.serialize_key(
                    previous_alive_player_count,
                    alive_player_count,
                    tuple(alive_player_slots),
                    previous_full_oriented_structure,
                )
                b2 = self.models.get("entry_b2", {}).get(entry_key_b2)
                if b2 is not None:
                    return PredictionResult(True, b2, "entry_b2", "ok", (entry_key_b2,))

                entry_key_b3 = self.serialize_key(
                    previous_alive_player_count,
                    alive_player_count,
                    previous_full_oriented_structure,
                )
                b3 = self.models.get("entry_b3", {}).get(entry_key_b3)
                if b3 is not None:
                    return PredictionResult(True, b3, "entry_b3", "ok", (entry_key_b3,))
                return PredictionResult(False, None, "entry_other", "missing_entry_other_key", (entry_key,))

            trans_key = self.serialize_key(
                alive_player_count,
                tuple(alive_player_slots),
                previous_full_oriented_structure,
                int(streak_step or 0),
                schedule_index,
            )
            pred = self.models.get("trans_other", {}).get(trans_key)
            if pred is not None:
                return PredictionResult(True, pred, "trans_other", "ok", (trans_key,))

            trans_key_b1 = self.serialize_key(alive_player_count, previous_full_oriented_structure, int(streak_step or 0), schedule_index)
            b1 = self.models.get("trans_b1", {}).get(trans_key_b1)
            if b1 is not None:
                return PredictionResult(True, b1, "trans_b1", "ok", (trans_key_b1,))

            trans_key_b2 = self.serialize_key(alive_player_count, tuple(alive_player_slots), previous_full_oriented_structure, int(streak_step or 0))
            b2 = self.models.get("trans_b2", {}).get(trans_key_b2)
            if b2 is not None:
                return PredictionResult(True, b2, "trans_b2", "ok", (trans_key_b2,))

            trans_key_b3 = self.serialize_key(alive_player_count, previous_full_oriented_structure, int(streak_step or 0))
            b3 = self.models.get("trans_b3", {}).get(trans_key_b3)
            if b3 is not None:
                return PredictionResult(True, b3, "trans_b3", "ok", (trans_key_b3,))

            trans_key_b4 = self.serialize_key(alive_player_count, previous_full_oriented_structure)
            b4 = self.models.get("trans_b4", {}).get(trans_key_b4)
            if b4 is not None:
                return PredictionResult(True, b4, "trans_b4", "ok", (trans_key_b4,))
            return PredictionResult(False, None, "trans_other", "missing_trans_other_key", (trans_key,))

        return PredictionResult(False, None, "unsupported_player_count", "alive_player_count_must_be_2_to_8")
