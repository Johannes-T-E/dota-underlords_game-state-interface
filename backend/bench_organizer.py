"""
Bench organizer automation for Dota Underlords (Windows).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional
import ctypes
import time

try:
    import win32api
    import win32con
    import win32gui
    import win32process
except ImportError:  # pragma: no cover - handled with diagnostics
    win32api = None
    win32con = None
    win32gui = None
    win32process = None

WINDOW_TITLES = ("Dota Underlords", "Underlords")

# Bench geometry (client-space pixels), based on user calibration:
# - 8 slots
# - each slot 140px wide
# - 10px gap between slots
# - first slot starts at x=370px
# - y=120px from bottom for all slots
BENCH_SLOT_COUNT = 8
BENCH_SLOT_START_X_PX = 370
BENCH_SLOT_WIDTH_PX = 140
BENCH_SLOT_GAP_PX = 10
BENCH_SLOT_PITCH_PX = BENCH_SLOT_WIDTH_PX + BENCH_SLOT_GAP_PX
BENCH_SLOT_CENTER_OFFSET_X_PX = BENCH_SLOT_WIDTH_PX // 2
BENCH_ROW_FROM_BOTTOM_PX = 120

# Keep pickup and drop on the same row.
PICKUP_Y_OFFSET_PX = 0
DROP_Y_OFFSET_PX = 0

# If True, relax the minimum row clamp so the bench line can sit lower (higher Y).
BENCH_ROW_MIN_FRAC_FROM_TOP = 0.50

_dpi_awareness_initialized = False


def _ensure_process_dpi_aware() -> None:
    """
    Make this process DPI-aware so GetClientRect/ClientToScreen and SetCursorPos
    use the same physical pixel space as DPI-aware apps (e.g. the game) under
    Windows display scaling (125%, 150%, etc.).
    """
    global _dpi_awareness_initialized
    if _dpi_awareness_initialized:
        return
    _dpi_awareness_initialized = True

    # Windows 10 1703+: PER_MONITOR_AWARE_V2 — best match for mixed-DPI / scaled desktops.
    try:
        user32 = ctypes.windll.user32
        # DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 == (HANDLE)-4
        if user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4)):
            return
    except Exception:
        pass

    # Windows 8.1+: per-monitor DPI aware.
    try:
        shcore = ctypes.windll.shcore
        PROCESS_PER_MONITOR_DPI_AWARE = 2
        shcore.SetProcessDpiAwareness(PROCESS_PER_MONITOR_DPI_AWARE)
        return
    except Exception:
        pass

    # Legacy: system DPI aware (better than unaware for single-monitor setups).
    try:
        ctypes.windll.user32.SetProcessDPIAware()
    except Exception:
        pass


def _dpi_context_for_window(hwnd: int) -> Dict:
    """Best-effort DPI info for diagnostics (hwnd = Underlords)."""
    out: Dict[str, object] = {"dpi_awareness_set": _dpi_awareness_initialized}
    try:
        user32 = ctypes.windll.user32
        if hasattr(user32, "GetDpiForWindow"):
            out["window_dpi"] = int(user32.GetDpiForWindow(hwnd))
        if hasattr(user32, "GetDpiForSystem"):
            out["system_dpi"] = int(user32.GetDpiForSystem())
    except Exception:
        pass
    return out

# Click-and-drag timing (Win32 mouse_event path).
PRE_CLICK_DELAY_SEC = 0.03
AFTER_MOUSEDOWN_DELAY_SEC = 0.07
DRAG_STEP_SLEEP_SEC = 0.012
POST_DRAG_DELAY_SEC = 0.06
DRAG_STEPS = 6


class BenchOrganizerError(Exception):
    """Raised when bench organization cannot run safely."""


@dataclass
class BenchUnit:
    entindex: int
    unit_id: int
    rank: int
    x: int
    y: int


def _dependency_error() -> str | None:
    missing = []
    if win32gui is None or win32con is None or win32api is None or win32process is None:
        missing.append("pywin32")
    if missing:
        return f"Missing Python dependencies: {', '.join(missing)}"
    return None


def _find_underlords_window() -> int:
    assert win32gui is not None

    matches: List[int] = []

    def callback(hwnd: int, _):
        if not win32gui.IsWindowVisible(hwnd):
            return
        title = win32gui.GetWindowText(hwnd) or ""
        if any(token.lower() in title.lower() for token in WINDOW_TITLES):
            matches.append(hwnd)

    win32gui.EnumWindows(callback, None)
    if not matches:
        raise BenchOrganizerError("Underlords window not found.")
    return matches[0]


def _focus_window(hwnd: int) -> None:
    assert win32gui is not None
    assert win32con is not None
    assert win32api is not None
    assert win32process is not None

    if win32gui.IsIconic(hwnd):
        win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
        time.sleep(0.08)
    win32gui.ShowWindow(hwnd, win32con.SW_SHOW)

    def is_foreground() -> bool:
        return win32gui.GetForegroundWindow() == hwnd

    # First attempt: regular foreground call.
    try:
        win32gui.SetForegroundWindow(hwnd)
    except Exception:
        pass
    time.sleep(0.08)
    if is_foreground():
        return

    # Second attempt: top/active hints.
    try:
        win32gui.BringWindowToTop(hwnd)
        win32gui.SetActiveWindow(hwnd)
        win32gui.SetForegroundWindow(hwnd)
    except Exception:
        pass
    time.sleep(0.08)
    if is_foreground():
        return

    # Third attempt: attach input thread + Alt key nudge (common Win32 workaround).
    try:
        foreground_hwnd = win32gui.GetForegroundWindow()
        current_thread_id = win32api.GetCurrentThreadId()
        foreground_thread_id = win32process.GetWindowThreadProcessId(foreground_hwnd)[0] if foreground_hwnd else 0
        target_thread_id = win32process.GetWindowThreadProcessId(hwnd)[0]

        if foreground_thread_id:
            win32process.AttachThreadInput(current_thread_id, foreground_thread_id, True)
        win32process.AttachThreadInput(current_thread_id, target_thread_id, True)

        # Simulate ALT press/release to satisfy foreground activation policy.
        win32api.keybd_event(win32con.VK_MENU, 0, 0, 0)
        time.sleep(0.01)
        win32api.keybd_event(win32con.VK_MENU, 0, win32con.KEYEVENTF_KEYUP, 0)

        win32gui.BringWindowToTop(hwnd)
        win32gui.SetForegroundWindow(hwnd)
        win32gui.SetActiveWindow(hwnd)
    except Exception:
        pass
    finally:
        try:
            foreground_hwnd = win32gui.GetForegroundWindow()
            current_thread_id = win32api.GetCurrentThreadId()
            foreground_thread_id = win32process.GetWindowThreadProcessId(foreground_hwnd)[0] if foreground_hwnd else 0
            target_thread_id = win32process.GetWindowThreadProcessId(hwnd)[0]
            if foreground_thread_id:
                win32process.AttachThreadInput(current_thread_id, foreground_thread_id, False)
            win32process.AttachThreadInput(current_thread_id, target_thread_id, False)
        except Exception:
            pass

    time.sleep(0.1)
    if not is_foreground():
        raise BenchOrganizerError(
            "Failed to focus Underlords window (Windows foreground lock blocked activation)."
        )


def _client_rect_screen(hwnd: int) -> Tuple[int, int, int, int]:
    assert win32gui is not None
    left, top, right, bottom = win32gui.GetClientRect(hwnd)
    origin_left, origin_top = win32gui.ClientToScreen(hwnd, (left, top))
    origin_right, origin_bottom = win32gui.ClientToScreen(hwnd, (right, bottom))
    return origin_left, origin_top, origin_right, origin_bottom


def _slot_points_from_rect(rect: Tuple[int, int, int, int]) -> Dict[int, Tuple[int, int]]:
    left, top, right, bottom = rect
    height = max(1, bottom - top)

    # Single horizontal bench row, anchored by absolute pixel distance from bottom.
    bench_row_y = int(bottom - BENCH_ROW_FROM_BOTTOM_PX)
    bench_row_y = min(bench_row_y, bottom - 4)
    bench_row_y = max(bench_row_y, top + int(height * BENCH_ROW_MIN_FRAC_FROM_TOP))

    points: Dict[int, Tuple[int, int]] = {}
    for idx in range(BENCH_SLOT_COUNT):
        x = int(left + BENCH_SLOT_START_X_PX + idx * BENCH_SLOT_PITCH_PX + BENCH_SLOT_CENTER_OFFSET_X_PX)
        points[idx] = (x, bench_row_y)
    return points


def _set_cursor(x: int, y: int) -> None:
    assert win32api is not None
    win32api.SetCursorPos((int(x), int(y)))


def _clamp_to_client_rect(x: int, y: int, rect: Tuple[int, int, int, int], margin: int = 2) -> Tuple[int, int]:
    left, top, right, bottom = rect
    clamped_x = max(left + margin, min(int(x), right - margin))
    clamped_y = max(top + margin, min(int(y), bottom - margin))
    return clamped_x, clamped_y


def _drag_slot_to_slot(
    points: Dict[int, Tuple[int, int]],
    src: int,
    dst: int,
    client_rect_screen: Tuple[int, int, int, int],
) -> None:
    """
    Explicit click-drag: move to source, left down, move to destination in steps, left up.
    Uses Win32 APIs so the game sees a real press/hold/release sequence.
    """
    assert win32api is not None
    assert win32con is not None

    sx, sy = points[src]
    dx, dy = points[dst]
    pickup_x, pickup_y = _clamp_to_client_rect(sx, sy + PICKUP_Y_OFFSET_PX, client_rect_screen)
    drop_x, drop_y = _clamp_to_client_rect(dx, dy + DROP_Y_OFFSET_PX, client_rect_screen)

    _set_cursor(pickup_x, pickup_y)
    time.sleep(PRE_CLICK_DELAY_SEC)
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    time.sleep(AFTER_MOUSEDOWN_DELAY_SEC)

    for step in range(1, DRAG_STEPS + 1):
        t = step / DRAG_STEPS
        ix = int(pickup_x + (drop_x - pickup_x) * t)
        iy = int(pickup_y + (drop_y - pickup_y) * t)
        ix, iy = _clamp_to_client_rect(ix, iy, client_rect_screen)
        _set_cursor(ix, iy)
        time.sleep(DRAG_STEP_SLEEP_SEC)

    # Force exact final destination before release (no overshoot drift).
    final_x, final_y = _clamp_to_client_rect(drop_x, drop_y, client_rect_screen)
    _set_cursor(final_x, final_y)
    time.sleep(0.02)
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    time.sleep(POST_DRAG_DELAY_SEC)


def _extract_bench_units(public_player_state: Dict) -> List[BenchUnit]:
    units = public_player_state.get("units") or []
    bench: List[BenchUnit] = []
    for unit in units:
        position = unit.get("position") or {}
        y = int(position.get("y", 0))
        if y != -1:
            continue
        bench.append(
            BenchUnit(
                entindex=int(unit.get("entindex")),
                unit_id=int(unit.get("unit_id")),
                rank=int(unit.get("rank", 1)),
                x=int(position.get("x", 0)),
                y=y,
            )
        )
    return bench


def _group_sort_key(group: List[BenchUnit]) -> Tuple[int, int, int]:
    """
    Group ordering for hero clusters (left to right):
    1) Highest rank in the group (desc)
    2) Group size (desc) so duplicates stay compact earlier
    3) unit_id (desc) as deterministic tiebreaker
    """
    max_rank = max((unit.rank for unit in group), default=0)
    return (-max_rank, -len(group), -group[0].unit_id)


def _unit_in_group_sort_key(unit: BenchUnit) -> Tuple[int, int]:
    # Inside a same-hero cluster: higher rank goes left.
    return (-unit.rank, unit.entindex)


def _get_desired_order(bench_units: List[BenchUnit]) -> List[BenchUnit]:
    # Cluster same heroes together, with highest-rank copies left within each cluster.
    grouped_by_unit_id: Dict[int, List[BenchUnit]] = {}
    for unit in bench_units:
        grouped_by_unit_id.setdefault(unit.unit_id, []).append(unit)

    groups = list(grouped_by_unit_id.values())
    for group in groups:
        group.sort(key=_unit_in_group_sort_key)
    groups.sort(key=_group_sort_key)

    sorted_units: List[BenchUnit] = []
    for group in groups:
        sorted_units.extend(group)
    return sorted_units


def _resolve_desired_order(
    bench_units: List[BenchUnit],
    desired_entindex_order: Optional[List[int]],
) -> List[BenchUnit]:
    if not desired_entindex_order:
        return _get_desired_order(bench_units)

    entindex_to_unit = {unit.entindex: unit for unit in bench_units}
    used = set()
    resolved: List[BenchUnit] = []

    for entindex in desired_entindex_order:
        unit = entindex_to_unit.get(int(entindex))
        if unit is None or unit.entindex in used:
            continue
        resolved.append(unit)
        used.add(unit.entindex)

    # Append any bench units omitted by frontend to keep execution safe.
    for unit in sorted(bench_units, key=lambda u: u.x):
        if unit.entindex not in used:
            resolved.append(unit)
            used.add(unit.entindex)

    return resolved


def _build_move_plan(
    bench_units: List[BenchUnit],
    desired_order: List[BenchUnit],
) -> List[Tuple[int, int, BenchUnit]]:
    """
    Build swap-oriented plan.
    Underlords supports swap by dragging onto occupied slot, so we use that
    explicitly to avoid unstable multi-step relocation behavior.
    """
    current_by_slot = {u.x: u for u in bench_units if 0 <= u.x <= 7}
    desired_entindex_by_slot = {idx: unit.entindex for idx, unit in enumerate(desired_order)}

    # Mutable slot -> entindex map to simulate swaps as we plan.
    slot_to_entindex = {slot: unit.entindex for slot, unit in current_by_slot.items()}
    entindex_to_slot = {unit.entindex: slot for slot, unit in current_by_slot.items()}
    entindex_to_unit = {unit.entindex: unit for unit in bench_units}

    moves: List[Tuple[int, int, BenchUnit]] = []
    for target_slot in range(len(desired_order)):
        desired_entindex = desired_entindex_by_slot.get(target_slot)
        if desired_entindex is None:
            continue

        current_slot = entindex_to_slot.get(desired_entindex)
        if current_slot is None or current_slot == target_slot:
            continue

        moving_unit = entindex_to_unit[desired_entindex]
        moves.append((current_slot, target_slot, moving_unit))

        occupying_entindex = slot_to_entindex.get(target_slot)
        slot_to_entindex[target_slot] = desired_entindex
        entindex_to_slot[desired_entindex] = target_slot

        if occupying_entindex is not None:
            slot_to_entindex[current_slot] = occupying_entindex
            entindex_to_slot[occupying_entindex] = current_slot
        else:
            slot_to_entindex.pop(current_slot, None)

    return moves


def _serialize_unit(unit: BenchUnit) -> Dict:
    return {
        "entindex": unit.entindex,
        "unit_id": unit.unit_id,
        "rank": unit.rank,
        "slot": unit.x,
    }


def organize_bench(
    public_player_state: Dict,
    dry_run: bool = False,
    desired_entindex_order: Optional[List[int]] = None,
) -> Dict:
    """
    Organize bench units by rule-based ordering.
    Returns diagnostics and move count.
    """
    dep_error = _dependency_error()
    if dep_error:
        raise BenchOrganizerError(dep_error)

    _ensure_process_dpi_aware()

    bench_units = _extract_bench_units(public_player_state)
    if len(bench_units) < 2:
        return {
            "moves_executed": 0,
            "diagnostics": {
                "bench_units": len(bench_units),
                "message": "Bench has fewer than 2 units. Nothing to organize.",
            },
        }

    hwnd = _find_underlords_window()
    dpi_info = _dpi_context_for_window(hwnd)
    rect = _client_rect_screen(hwnd)
    points = _slot_points_from_rect(rect)

    target_order = _resolve_desired_order(bench_units, desired_entindex_order)
    move_plan = _build_move_plan(bench_units, target_order)
    current_order = sorted((u for u in bench_units if 0 <= u.x <= 7), key=lambda unit: unit.x)
    if not dry_run:
        assert win32api is not None
        original_cursor = win32api.GetCursorPos()

        _focus_window(hwnd)
        try:
            for src, dst, _unit in move_plan:
                _drag_slot_to_slot(points, src, dst, rect)
        finally:
            # Restore mouse cursor to where user last had it.
            win32api.SetCursorPos(original_cursor)

    return {
        "moves_executed": len(move_plan),
        "diagnostics": {
            "dry_run": dry_run,
            "window_handle": hwnd,
            "window_rect": {
                "left": rect[0],
                "top": rect[1],
                "right": rect[2],
                "bottom": rect[3],
            },
            "slot_points": points,
            "bench_geometry": {
                "row_screen_y": points[0][1] if points else None,
                "client_rect_screen": {"left": rect[0], "top": rect[1], "right": rect[2], "bottom": rect[3]},
                "from_bottom_px": BENCH_ROW_FROM_BOTTOM_PX,
                "pickup_drop_y_offset_px": PICKUP_Y_OFFSET_PX,
                "min_frac_from_top": BENCH_ROW_MIN_FRAC_FROM_TOP,
                "slot_start_x_px": BENCH_SLOT_START_X_PX,
                "slot_width_px": BENCH_SLOT_WIDTH_PX,
                "slot_gap_px": BENCH_SLOT_GAP_PX,
                "dpi": dpi_info,
            },
            "bench_units": len(bench_units),
            "current_order": [_serialize_unit(unit) for unit in current_order],
            "target_order": [_serialize_unit(unit) for unit in target_order],
            "planned_moves": [{"from_slot": src, "to_slot": dst} for src, dst, _ in move_plan],
        },
    }
