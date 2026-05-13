"""
Temporary helper: map Underlords board cell centers by clicking in-game.

Usage (from repo root, with venv that has pywin32):
  python scripts/map_underlords_board_cells.py

Flow:
  1. Underlords must be running (detected by game executable name, e.g. underlords2.exe — not your repo folder).
  2. A short countdown runs; Alt+Tab to the game and keep it **focused** while you click.
  3. Click the center of each board cell in order: row 0 left→right (8 cells),
     then row 1, … for 4 rows (32 clicks total).
     Here **row 0 is the top row on screen**; that is **GSI y=3**. Row 3 (bottom) is **GSI y=0**.
     **Column c** matches **GSI x** (0 = left).
  4. A click counts only if **Underlords is the foreground window** when you press
     the button (hit-testing under the cursor is unreliable with overlays / other apps).
  5. Press Escape to abort.

Output: screen (x, y) and client (cx, cy) for each cell, plus copy-paste Python snippets.
"""
from __future__ import annotations

import sys
import time
from pathlib import Path
from typing import List, Tuple

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    import win32api
    import win32con
    import win32gui
except ImportError:
    print("This script requires pywin32 (win32api, win32con, win32gui).", file=sys.stderr)
    sys.exit(1)

from backend.bench_organizer import (  # noqa: E402
    BenchOrganizerError,
    _ensure_process_dpi_aware,
    _find_main_underlords_hwnd,
)
ROWS = 4
COLS = 8
TOTAL = ROWS * COLS
POLL_INTERVAL_SEC = 0.008


def _foreground_root_hwnd() -> int:
    fg = win32gui.GetForegroundWindow()
    if not fg:
        return 0
    return int(win32gui.GetAncestor(fg, win32con.GA_ROOT))


def _click_counts_underlords_focused(game_hwnd: int) -> bool:
    return _foreground_root_hwnd() == int(game_hwnd)


def _screen_to_client(hwnd: int, sx: int, sy: int) -> Tuple[int, int]:
    cx, cy = win32gui.ScreenToClient(hwnd, (sx, sy))
    return int(cx), int(cy)


def main() -> None:
    _ensure_process_dpi_aware()
    try:
        game_hwnd, game_exe = _find_main_underlords_hwnd()
    except BenchOrganizerError as e:
        print(e, file=sys.stderr)
        sys.exit(1)
    cl, ct, cr, cb = win32gui.GetClientRect(game_hwnd)
    client_w, client_h = cr - cl, cb - ct

    print(
        f"Using Underlords window hwnd={game_hwnd}\n"
        f"  Process: {game_exe}\n"
        f"  Game client size (now): {client_w} × {client_h}\n\n"
        f"After the countdown, perform {TOTAL} single left-clicks on board cell centers:\n"
        f"  Row 0: left → right ({COLS} cells), then row 1, … ({ROWS} rows).\n"
        f"Keep Underlords **focused** (foreground) for each click — that is how we detect the game.\n"
        f"Press Escape to cancel.\n"
    )
    for i in range(5, 0, -1):
        print(f"  Starting in {i}…", flush=True)
        time.sleep(1)

    screen_points: List[Tuple[int, int]] = []
    prev_down = False

    print("Recording… (left-click each cell in order)\n")

    while len(screen_points) < TOTAL:
        if win32api.GetAsyncKeyState(win32con.VK_ESCAPE) & 0x8000:
            print("\nAborted (Escape).")
            sys.exit(1)

        down = bool(win32api.GetAsyncKeyState(win32con.VK_LBUTTON) & 0x8000)
        if down and not prev_down:
            sx, sy = win32api.GetCursorPos()
            if _click_counts_underlords_focused(game_hwnd):
                screen_points.append((sx, sy))
                r = (len(screen_points) - 1) // COLS
                c = (len(screen_points) - 1) % COLS
                cx, cy = _screen_to_client(game_hwnd, sx, sy)
                print(f"  {len(screen_points):2}/{TOTAL}  row={r} col={c}  screen=({sx}, {sy})  client=({cx}, {cy})")
            else:
                fg = _foreground_root_hwnd()
                hint = win32gui.GetWindowText(fg)[:72] if fg else "(none)"
                print(f"  (ignored — Underlords not foreground; active window: {hint!r})")
        prev_down = down
        time.sleep(POLL_INTERVAL_SEC)

    client_points = [_screen_to_client(game_hwnd, sx, sy) for sx, sy in screen_points]

    print("\n--- Screen coordinates (x, y) row-major, top-left → bottom-right ---\n")
    for r in range(ROWS):
        row = screen_points[r * COLS : (r + 1) * COLS]
        print(f"  row{r}: {row}")

    print("\n--- Client coordinates (relative to game client area) ---\n")
    for r in range(ROWS):
        row = client_points[r * COLS : (r + 1) * COLS]
        print(f"  row{r}: {row}")

    print("\n--- Python: screen points (row-major nested list) ---\n")
    nested_screen = [screen_points[r * COLS : (r + 1) * COLS] for r in range(ROWS)]
    print(f"BOARD_CELL_POINTS_SCREEN = {nested_screen!r}")

    print("\n--- Python: client points (row-major nested list) ---\n")
    nested_client = [client_points[r * COLS : (r + 1) * COLS] for r in range(ROWS)]
    print(f"BOARD_CELL_POINTS_CLIENT = {nested_client!r}")

    _cl, _ct, _cr, cb_end = win32gui.GetClientRect(game_hwnd)
    ref_h = cb_end - _ct
    print("\n--- Paste into backend/board_cells.py ---\n")
    print(f"BOARD_CELLS_REFERENCE_CLIENT_HEIGHT_PX = {ref_h}  # client height when you captured (bottom of GetClientRect)")

    print("\nDone.")


if __name__ == "__main__":
    main()
