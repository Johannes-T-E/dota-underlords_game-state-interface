"""
Battle board cell centers in Underlords client space (4×8 grid, row-major).

Captured with scripts/map_underlords_board_cells.py. Coordinates are scaled by
client height (same idea as bench_organizer) so other resolutions stay aligned.

If clicks drift after a game/UI patch, re-run the mapper and replace
BOARD_CELL_POINTS_CLIENT_REF; set BOARD_CELLS_REFERENCE_CLIENT_HEIGHT_PX to the
game client height (bottom − top from GetClientRect) at capture time.

---------------------------------------------------------------------------
Grid labels — **GSI / game** vs **this module (calibration rows)**

``public_player_state.units[].position`` (and the web UI) use:

- **x**: 0–7, left → right across the board or bench.
- **y**: ``-1`` = bench; on the board, **0–3** where **y=3 is the top row** (back / far row)
  and **y=0 is the bottom row** (near the player). Same convention as
  ``frontend/src/features/player-board/utils/positionUtils.ts`` (“y=3→top, y=0→bottom”).

The calibrated table ``BOARD_CELL_POINTS_CLIENT_REF`` is indexed by **(row, col)** with
**row=0 at the top** of the screen (first row you click when mapping) and **col=0 at the left**.
So **col == GSI x**, and **row == (BOARD_ROWS - 1) - GSI y** on the board.

**Bench:** GSI ``y == -1``; bench slot index in automation matches **GSI x** (0 = leftmost).
See ``backend/bench_organizer.py`` (slot indices 0–7).
---------------------------------------------------------------------------
"""
from __future__ import annotations

from typing import List, Tuple

try:
    import win32gui
except ImportError:
    win32gui = None  # pragma: no cover

BOARD_ROWS = 4
BOARD_COLS = 8

# GSI ``position.y`` for units on the bench (see module docstring).
GSI_BENCH_Y = -1

# Client height when BOARD_CELL_POINTS_CLIENT_REF was recorded (update if you recalibrate).
BOARD_CELLS_REFERENCE_CLIENT_HEIGHT_PX = 1080

# Client (cx, cy) cell centers: row 0 = top screen row, col 0 = left (see GSI mapping above).
BOARD_CELL_POINTS_CLIENT_REF: Tuple[Tuple[Tuple[int, int], ...], ...] = (
    ((616, 469), (716, 471), (811, 472), (909, 470), (1010, 471), (1110, 469), (1204, 468), (1296, 464)),
    ((605, 555), (705, 562), (809, 566), (907, 563), (1012, 563), (1113, 563), (1210, 563), (1310, 558)),
    ((594, 663), (696, 663), (804, 667), (907, 662), (1017, 664), (1122, 665), (1228, 664), (1331, 658)),
    ((579, 769), (690, 770), (794, 775), (906, 767), (1017, 767), (1134, 766), (1236, 769), (1347, 765)),
)


def board_cells_scale(client_height_px: int) -> float:
    return max(1, int(client_height_px)) / float(BOARD_CELLS_REFERENCE_CLIENT_HEIGHT_PX)


def board_row_from_gsi_y(gsi_y: int) -> int:
    """Convert GSI board ``y`` (0=bottom … 3=top) to calibration ``row`` (0=top … 3=bottom)."""
    if not 0 <= gsi_y < BOARD_ROWS:
        raise ValueError(f"GSI board y must be 0..{BOARD_ROWS - 1}, got {gsi_y}")
    return BOARD_ROWS - 1 - gsi_y


def gsi_y_from_board_row(row: int) -> int:
    """Convert calibration ``row`` (0=top) to GSI board ``y`` (3=top)."""
    if not 0 <= row < BOARD_ROWS:
        raise ValueError(f"board row must be 0..{BOARD_ROWS - 1}, got {row}")
    return BOARD_ROWS - 1 - row


def _validate_gsi_board_x(gsi_x: int) -> None:
    if not 0 <= gsi_x < BOARD_COLS:
        raise ValueError(f"GSI board x must be 0..{BOARD_COLS - 1}, got {gsi_x}")


def board_cell_client_center_from_gsi(
    gsi_x: int, gsi_y: int, client_height_px: int
) -> Tuple[int, int]:
    """Cell center in client pixels using GSI board coordinates (``y`` in 0..3, top=3)."""
    _validate_gsi_board_x(gsi_x)
    row = board_row_from_gsi_y(gsi_y)
    return board_cell_client_center(row, gsi_x, client_height_px)


def board_cell_screen_center_from_gsi(hwnd: int, gsi_x: int, gsi_y: int) -> Tuple[int, int]:
    """Screen coordinates for cell center from GSI board ``(x, y)`` (requires pywin32)."""
    if win32gui is None:
        raise RuntimeError("pywin32 (win32gui) is required for board_cell_screen_center_from_gsi")
    _l, _t, _r, bottom = win32gui.GetClientRect(hwnd)
    client_h = max(1, bottom)
    cx, cy = board_cell_client_center_from_gsi(gsi_x, gsi_y, client_h)
    sx, sy = win32gui.ClientToScreen(hwnd, (cx, cy))
    return int(sx), int(sy)


def board_cell_client_center(row: int, col: int, client_height_px: int) -> Tuple[int, int]:
    if not (0 <= row < BOARD_ROWS and 0 <= col < BOARD_COLS):
        raise ValueError(f"board cell out of range: ({row}, {col})")
    x0, y0 = BOARD_CELL_POINTS_CLIENT_REF[row][col]
    s = board_cells_scale(client_height_px)
    return int(round(x0 * s)), int(round(y0 * s))


def board_cell_screen_center(hwnd: int, row: int, col: int) -> Tuple[int, int]:
    """Screen coordinates using calibration ``(row, col)`` (row 0 = top). For GSI ``(x,y)``, use ``board_cell_screen_center_from_gsi``."""
    if win32gui is None:
        raise RuntimeError("pywin32 (win32gui) is required for board_cell_screen_center")
    _l, _t, _r, bottom = win32gui.GetClientRect(hwnd)
    client_h = max(1, bottom)
    cx, cy = board_cell_client_center(row, col, client_h)
    sx, sy = win32gui.ClientToScreen(hwnd, (cx, cy))
    return int(sx), int(sy)


def all_board_cell_client_centers(client_height_px: int) -> List[List[Tuple[int, int]]]:
    h = max(1, int(client_height_px))
    return [[board_cell_client_center(r, c, h) for c in range(BOARD_COLS)] for r in range(BOARD_ROWS)]


def board_region_client_bounds_exclusive(
    client_height_px: int, *, pad_frac: float = 0.55
) -> Tuple[int, int, int, int]:
    """
    Axis-aligned battle **board** region in **client** coordinates (left, top, right, bottom).

    ``right`` / ``bottom`` use the same convention as ``GetClientRect``: one pixel past the last
    included row/column (exclusive max). The box encloses all calibrated cell centers plus a pad
    derived from center-to-center spacing (``pad_frac`` of one cell step per axis).
    """
    pts = all_board_cell_client_centers(client_height_px)
    xs = [p[0] for row in pts for p in row]
    ys = [p[1] for row in pts for p in row]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    dx = (max_x - min_x) / max(1, BOARD_COLS - 1)
    dy = (max_y - min_y) / max(1, BOARD_ROWS - 1)
    pad_x = int(round(dx * pad_frac))
    pad_y = int(round(dy * pad_frac))
    left = min_x - pad_x
    top = min_y - pad_y
    right_excl = max_x + pad_x + 1
    bottom_excl = max_y + pad_y + 1
    return left, top, right_excl, bottom_excl


def board_region_screen_rect(hwnd: int, *, pad_frac: float = 0.55) -> Tuple[int, int, int, int]:
    """Screen-space board bounding box (same edge convention as ``GetClientRect`` / ``_client_rect_screen``)."""
    if win32gui is None:
        raise RuntimeError("pywin32 (win32gui) is required for board_region_screen_rect")
    _l, _t, cr, cb = win32gui.GetClientRect(hwnd)
    cw = max(1, cr)
    ch = max(1, cb)
    cl, ct, cr_ex, cb_ex = board_region_client_bounds_exclusive(ch, pad_frac=pad_frac)
    cl = max(0, min(cl, cw - 1))
    ct = max(0, min(ct, ch - 1))
    cr_ex = max(cl + 1, min(cr_ex, cw))
    cb_ex = max(ct + 1, min(cb_ex, ch))
    origin_left, origin_top = win32gui.ClientToScreen(hwnd, (cl, ct))
    origin_right, origin_bottom = win32gui.ClientToScreen(hwnd, (cr_ex, cb_ex))
    return int(origin_left), int(origin_top), int(origin_right), int(origin_bottom)


def zigzag_board_path() -> List[Tuple[int, int]]:
    """
    Column-serpentine path in **calibration indices** ``(row, col)``:
    col 0 top→bottom, col 1 bottom→top, … Visits all 4×8 cells once.

    For GSI ``(x, y)`` (game / ``positionUtils``), use ``zigzag_gsi_board_path()``.
    """
    path: List[Tuple[int, int]] = []
    for c in range(BOARD_COLS):
        if c % 2 == 0:
            for r in range(BOARD_ROWS):
                path.append((r, c))
        else:
            for r in range(BOARD_ROWS - 1, -1, -1):
                path.append((r, c))
    return path


def zigzag_gsi_board_path() -> List[Tuple[int, int]]:
    """
    Same traversal as ``zigzag_board_path``, expressed as GSI board coordinates
    ``(position.x, position.y)`` with ``y`` in 0..3 (**3 = top row**).
    """
    return [(col, gsi_y_from_board_row(row)) for row, col in zigzag_board_path()]
