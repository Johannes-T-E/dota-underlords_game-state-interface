# Standalone Matchup Predictor

Copy this whole folder to another project.

## Files
- `predictor.py`: standalone deterministic predictor implementation.
- `models.json`: learned model tables exported from your DB.
- `build_models.py`: regeneration script for `models.json`.

## Usage
```python
from pathlib import Path
from standalone_matchup_predictor.predictor import DeterministicMatchupPredictor

root = Path("standalone_matchup_predictor")
predictor = DeterministicMatchupPredictor.from_model_file(root / "models.json")

result = predictor.predict_matchups(
    alive_player_count=8,
    current_round_number=1,
    schedule_offset=0,
    alive_player_slots=(1, 2, 3, 4, 5, 6, 7, 8),
)
print(result.known, result.tier, result.reason, result.prediction)
```

## Regenerate models from current DB
Run from repo root:
```powershell
py -3 standalone_matchup_predictor/build_models.py
```
