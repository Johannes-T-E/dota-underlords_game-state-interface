# Matchup Predictor

Deterministic predictor and precomputed model tables used by the backend.

## Files
- `predictor.py`: standalone deterministic predictor implementation.
- `models.json`: learned model tables exported from your DB.
- `build_models.py`: regeneration script for `models.json`.

## Usage
```python
from pathlib import Path
from backend.domain.matchup_predictor import DeterministicMatchupPredictor

root = Path("backend/domain/matchup_predictor")
predictor = DeterministicMatchupPredictor.from_model_file(root / "models.json")

result = predictor.predict_matchups(
    alive_player_count=8,
    current_round_number=1,
    schedule_offset=0,
    alive_player_slots=(1, 2, 3, 4, 5, 6, 7, 8),
)
print(result.known, result.tier, result.reason, result.prediction)
```

`build_models.py` requires the external `comprehensive_round_predictor` training module;
the checked-in `models.json` is used at runtime.
