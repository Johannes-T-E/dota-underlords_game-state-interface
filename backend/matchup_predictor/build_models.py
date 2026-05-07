from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from comprehensive_round_predictor import (
    build_backoff_models,
    build_models,
    build_strict_models_7_6,
    load_clean_views,
)
from predictor import DeterministicMatchupPredictor


def main() -> None:
    _, _, _, alive, views, offsets = load_clean_views()
    entry_model, trans_model, entry_grouped, trans_grouped = build_models(alive, views, offsets)
    backoff = build_backoff_models(entry_grouped, trans_grouped)
    strict_models, _ = build_strict_models_7_6(alive, views, offsets)
    sk = DeterministicMatchupPredictor.serialize_key

    payload = {
        "entry7": {sk(*k): v for k, v in strict_models["entry7"].items()},
        "trans7": {sk(*k): v for k, v in strict_models["trans7"].items()},
        "entry6": {sk(*k): v for k, v in strict_models["entry6"].items()},
        "trans6": {sk(*k): v for k, v in strict_models["trans6"].items()},
        "entry_other": {sk(*k): v for k, v in entry_model.items() if k[1] in (5, 4, 3, 2)},
        "trans_other": {sk(*k): v for k, v in trans_model.items() if k[0] in (5, 4, 3, 2)},
        "entry_b1": {sk(*k): v for k, v in backoff["entry_b1"].items()},
        "entry_b2": {sk(*k): v for k, v in backoff["entry_b2"].items()},
        "entry_b3": {sk(*k): v for k, v in backoff["entry_b3"].items()},
        "trans_b1": {sk(*k): v for k, v in backoff["trans_b1"].items()},
        "trans_b2": {sk(*k): v for k, v in backoff["trans_b2"].items()},
        "trans_b3": {sk(*k): v for k, v in backoff["trans_b3"].items()},
        "trans_b4": {sk(*k): v for k, v in backoff["trans_b4"].items()},
    }

    out_path = Path(__file__).resolve().parent / "models.json"
    out_path.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {out_path}")
    print({k: len(v) for k, v in payload.items()})


if __name__ == "__main__":
    main()
