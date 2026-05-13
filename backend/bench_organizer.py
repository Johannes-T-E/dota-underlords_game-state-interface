"""
Bench organizer automation for Dota Underlords (Windows).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional
import ctypes
import os
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

_UNDERLORDS_MIN_CLIENT_AREA_PX = 200 * 200
_PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
_PROCESS_QUERY_VM = 0x0410


def _is_underlords_game_executable(basename_lower: str) -> bool:
    """
    Match only the real game image name(s), not unrelated tools whose path mentions Underlords
    (e.g. a repo folder named underlords_*). Cursor/VS Code/python.exe never match here.
    """
    if basename_lower in ("underlords.exe", "underlords2.exe", "dota underlords.exe"):
        return True
    if not (basename_lower.startswith("underlords") and basename_lower.endswith(".exe")):
        return False
    stem = basename_lower[:-4]
    if stem == "underlords":
        return True
    # underlords2, underlords64, …
    suffix = stem[9:]
    return suffix.isdigit()


def _exe_basename_for_pid(pid: int) -> str:
    assert win32api is not None
    assert win32process is not None
    if pid <= 0:
        return ""
    for access in (_PROCESS_QUERY_LIMITED_INFORMATION, _PROCESS_QUERY_VM):
        try:
            h = win32api.OpenProcess(access, False, pid)
        except Exception:
            # Stale HWND PIDs, protected processes, or access denied — skip this window.
            continue
        if not h:
            continue
        try:
            path = win32process.GetModuleFileNameEx(h, 0)
            return os.path.basename(path).lower()
        except Exception:
            pass
        finally:
            win32api.CloseHandle(int(h))
    return ""


def _client_area_screen_pixels(hwnd: int) -> int:
    assert win32gui is not None
    try:
        left, top, right, bottom = win32gui.GetClientRect(hwnd)
        return max(0, right - left) * max(0, bottom - top)
    except Exception:
        return 0


def _full_exe_path_for_pid(pid: int) -> str:
    assert win32api is not None
    assert win32process is not None
    if pid <= 0:
        return ""
    for access in (_PROCESS_QUERY_LIMITED_INFORMATION, _PROCESS_QUERY_VM):
        try:
            h = win32api.OpenProcess(access, False, pid)
        except Exception:
            continue
        if not h:
            continue
        try:
            return win32process.GetModuleFileNameEx(h, 0)
        except Exception:
            pass
        finally:
            win32api.CloseHandle(int(h))
    return ""


def _find_main_underlords_hwnd() -> Tuple[int, str]:
    """
    Largest visible top-level window whose process is the Underlords game executable
    (by image name allowlist — not folder/path heuristics).
    """
    assert win32gui is not None
    assert win32con is not None
    assert win32process is not None

    candidates: List[Tuple[int, int, str]] = []

    def callback(hwnd: int, _: object) -> None:
        if not win32gui.IsWindowVisible(hwnd):
            return
        if win32gui.GetWindow(hwnd, win32con.GW_OWNER):
            return
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        exe_base = _exe_basename_for_pid(pid)
        if not _is_underlords_game_executable(exe_base):
            return
        area = _client_area_screen_pixels(hwnd)
        if area < _UNDERLORDS_MIN_CLIENT_AREA_PX:
            return
        full_path = _full_exe_path_for_pid(pid) or exe_base
        candidates.append((area, hwnd, full_path))

    win32gui.EnumWindows(callback, None)
    if not candidates:
        raise BenchOrganizerError(
            "No visible Underlords game window found (expected executable underlords.exe / underlords2.exe, "
            f"client area ≥ {_UNDERLORDS_MIN_CLIENT_AREA_PX} px²). Is the game running?"
        )
    candidates.sort(key=lambda t: t[0], reverse=True)
    _area, hwnd, exe_path = candidates[0]
    return hwnd, exe_path


def _foreground_root_matches(hwnd: int) -> bool:
    """True if the foreground window belongs to this top-level hwnd (handles child HWND focus)."""
    assert win32gui is not None
    assert win32con is not None
    fg = win32gui.GetForegroundWindow()
    if not fg:
        return False
    if fg == hwnd:
        return True
    return win32gui.GetAncestor(fg, win32con.GA_ROOT) == hwnd

# Bench geometry reference (client-space pixels at BENCH_GEOMETRY_REFERENCE_CLIENT_HEIGHT_PX):
# - 8 slots, 140px wide, 10px gap between slots (5px of gap on each side of horizontal center)
# - Horizontally: bench is centered in the client — the midpoint between the 4th and 5th slot
#   (1-based) lies on the client horizontal center (between slot indices 3 and 4, 0-based).
# - Vertically: row 120px from bottom at reference height.
# - BENCH_SLOT_START_X_PX: legacy left inset used before center-based layout (1920-wide tuning only).
BENCH_GEOMETRY_REFERENCE_CLIENT_HEIGHT_PX = 1080
BENCH_SLOT_COUNT = 8
# Slot index == GSI ``public_player_state.units[].position.x`` when ``position.y == -1`` (bench).
# 0 = leftmost from the player's view; aligns with ``frontend`` PlayerBoard bench cells.
# Gap center between slot indices (BENCH_CENTER_GAP_AFTER_SLOT_INDEX) and (+1).
BENCH_CENTER_GAP_AFTER_SLOT_INDEX = 3
BENCH_SLOT_START_X_PX = 370
BENCH_SLOT_WIDTH_PX = 140
BENCH_SLOT_GAP_PX = 10
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


# Direct drag timing — tuned for fast, reliable drags (validated via board_zigzag_benchmark).
# AFTER_MOUSEDOWN: keep button down without moving so the client registers the grab before drag.
PRE_PICKUP_DELAY_SEC = 0.005
AFTER_MOUSEDOWN_DELAY_SEC = 0.01
BEFORE_MOUSEUP_DELAY_SEC = 0.01
POST_DRAG_DELAY_SEC = 0.012

# Default stepped cursor path for drag_screen_to_screen (short bench moves still register in-client).
DEFAULT_DRAG_MOVE_STEPS = 2
DEFAULT_DRAG_MOVE_STEP_SLEEP_SEC = 0.015

# After focusing the game, brief settle before first injected input (Alt-tab / DPI refresh).
SETTLE_AFTER_FOCUS_SEC = 0.14

# Between consecutive automated drags so a unit finishes moving (bench organize + benchmarks).
INTER_DRAG_SETTLE_SEC = 0.04


class BenchOrganizerError(Exception):
    """Raised when bench organization cannot run safely."""


@dataclass
class BenchUnit:
    entindex: int
    unit_id: int
    rank: int
    x: int
    y: int


@dataclass(frozen=True)
class ScaledBenchGeometry:
    """Bench layout in screen/client space after scaling by actual client height."""

    client_height_px: int
    reference_client_height_px: int
    scale: float
    row_from_bottom_px: int
    slot_width_px: int
    slot_gap_px: int
    pickup_y_offset_px: int
    drop_y_offset_px: int

    @property
    def slot_pitch_px(self) -> int:
        return self.slot_width_px + self.slot_gap_px


def _scaled_geometry_for_client_height(client_height_px: int) -> ScaledBenchGeometry:
    h = max(1, int(client_height_px))
    scale = h / float(BENCH_GEOMETRY_REFERENCE_CLIENT_HEIGHT_PX)
    return ScaledBenchGeometry(
        client_height_px=h,
        reference_client_height_px=BENCH_GEOMETRY_REFERENCE_CLIENT_HEIGHT_PX,
        scale=scale,
        row_from_bottom_px=int(round(BENCH_ROW_FROM_BOTTOM_PX * scale)),
        slot_width_px=int(round(BENCH_SLOT_WIDTH_PX * scale)),
        slot_gap_px=int(round(BENCH_SLOT_GAP_PX * scale)),
        pickup_y_offset_px=int(round(PICKUP_Y_OFFSET_PX * scale)),
        drop_y_offset_px=int(round(DROP_Y_OFFSET_PX * scale)),
    )


def _dependency_error() -> str | None:
    missing = []
    if win32gui is None or win32con is None or win32api is None or win32process is None:
        missing.append("pywin32")
    if missing:
        return f"Missing Python dependencies: {', '.join(missing)}"
    return None


def _find_underlords_window() -> int:
    hwnd, _path = _find_main_underlords_hwnd()
    return hwnd


def _focus_window(hwnd: int) -> None:
    assert win32gui is not None
    assert win32con is not None
    assert win32api is not None
    assert win32process is not None

    def is_foreground() -> bool:
        return _foreground_root_matches(hwnd)

    if is_foreground() and not win32gui.IsIconic(hwnd):
        return

    if win32gui.IsIconic(hwnd):
        win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
        time.sleep(0.05)
        if is_foreground():
            return

    if not win32gui.IsWindowVisible(hwnd):
        win32gui.ShowWindow(hwnd, win32con.SW_SHOW)

    # First attempt: regular foreground call.
    try:
        win32gui.SetForegroundWindow(hwnd)
    except Exception:
        pass
    time.sleep(0.02)
    if is_foreground():
        return

    # Second attempt: top/active hints.
    try:
        win32gui.BringWindowToTop(hwnd)
        win32gui.SetActiveWindow(hwnd)
        win32gui.SetForegroundWindow(hwnd)
    except Exception:
        pass
    time.sleep(0.04)
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

    time.sleep(0.06)
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


def _slot_points_from_rect(
    rect: Tuple[int, int, int, int], geometry: ScaledBenchGeometry
) -> Dict[int, Tuple[int, int]]:
    left, top, right, bottom = rect
    height = max(1, bottom - top)

    bench_row_y = int(bottom - geometry.row_from_bottom_px)
    bench_row_y = min(bench_row_y, bottom - 4)
    bench_row_y = max(bench_row_y, top + int(height * BENCH_ROW_MIN_FRAC_FROM_TOP))

    # Horizontal center of client: midpoint of the gap between slots (center_gap) and (center_gap+1).
    mid_x = (left + right) / 2.0
    center_slot_index = BENCH_CENTER_GAP_AFTER_SLOT_INDEX + 0.5
    pitch = float(geometry.slot_pitch_px)

    points: Dict[int, Tuple[int, int]] = {}
    for idx in range(BENCH_SLOT_COUNT):
        x = int(round(mid_x + (idx - center_slot_index) * pitch))
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


def drag_screen_to_screen(
    client_rect_screen: Tuple[int, int, int, int],
    geometry: ScaledBenchGeometry,
    from_screen: Tuple[int, int],
    to_screen: Tuple[int, int],
    pickup_y_offset: int = 0,
    drop_y_offset: int = 0,
    *,
    extra_pre_pickup_sec: float = 0.0,
    extra_after_mousedown_sec: float = 0.0,
    move_steps: int = DEFAULT_DRAG_MOVE_STEPS,
    move_step_sleep_sec: float = DEFAULT_DRAG_MOVE_STEP_SLEEP_SEC,
    between_actions_sec: float = 0.0,
    timing_scale: float = 1.0,
    verbose: bool = False,
    log_prefix: str = "    [input]",
) -> None:
    """
    Perform a real click-drag: left button down, move while held, left button up.

    Exact order (matches in-game unit drag):
      1. Move cursor onto the pick-up point (unit / slot center).
      2. **Left button down** — keep the button held.
      3. **Drag**: move cursor to the drop point while still holding (optionally in
         ``move_steps`` segments so the game sees continuous motion).
      4. **Left button up** — release.

    All delays are **wall-clock seconds** (module constants + optional extras),
    multiplied by ``timing_scale`` (1 = default; higher = slower, for weaker PCs).
    ``between_actions_sec`` is added to **every** internal pause (uniform spacing).
    Coordinates are clamped to the game client rect. For long drags, use
    ``move_steps`` > 1 and/or ``extra_after_mousedown_sec``.

    If ``verbose`` is True, prints each phase to stdout (for benchmarks / debugging).
    """
    assert win32api is not None
    assert win32con is not None

    def v(msg: str) -> None:
        if verbose:
            print(f"{log_prefix} {msg}", flush=True)

    ba = max(0.0, float(between_actions_sec))
    ts = max(0.01, float(timing_scale))

    def pause(sec: float) -> None:
        time.sleep((sec + ba) * ts)

    margin = max(1, int(round(2 * geometry.scale)))

    sx, sy = from_screen
    dx, dy = to_screen
    pickup_x, pickup_y = _clamp_to_client_rect(
        sx, sy + pickup_y_offset, client_rect_screen, margin=margin
    )
    drop_x, drop_y = _clamp_to_client_rect(
        dx, dy + drop_y_offset, client_rect_screen, margin=margin
    )

    # 1) Cursor on unit / source cell (no button pressed yet).
    v(f"move cursor to pickup ({pickup_x}, {pickup_y}) [screen px, no button]")
    _set_cursor(pickup_x, pickup_y)
    pause(PRE_PICKUP_DELAY_SEC + extra_pre_pickup_sec)

    # 2) Press and hold left button on the unit.
    v("LEFT BUTTON DOWN — hold on unit")
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    hold = AFTER_MOUSEDOWN_DELAY_SEC + extra_after_mousedown_sec
    v(f"pause {hold + ba:.3f}s (button held, no move — let game register grab)")
    pause(hold)

    # 3) Drag while holding: move toward destination (single jump or stepped path).
    steps = max(1, int(move_steps))
    if steps <= 1:
        v(f"drag (move while held) → drop ({drop_x}, {drop_y})")
        _set_cursor(drop_x, drop_y)
    else:
        v(f"drag path: {steps} steps while held (pickup → drop)")
        for step in range(1, steps + 1):
            t = step / steps
            ix = int(round(pickup_x + (drop_x - pickup_x) * t))
            iy = int(round(pickup_y + (drop_y - pickup_y) * t))
            ix, iy = _clamp_to_client_rect(ix, iy, client_rect_screen, margin=margin)
            v(f"  step {step}/{steps} cursor ({ix}, {iy})")
            _set_cursor(ix, iy)
            pause(move_step_sleep_sec)

    pause(BEFORE_MOUSEUP_DELAY_SEC)

    # 4) Release left button at drop location.
    v(f"LEFT BUTTON UP — release at ({drop_x}, {drop_y})")
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    pause(POST_DRAG_DELAY_SEC)


def _drag_slot_to_slot(
    points: Dict[int, Tuple[int, int]],
    src: int,
    dst: int,
    client_rect_screen: Tuple[int, int, int, int],
    geometry: ScaledBenchGeometry,
    timing_scale: float = 1.0,
) -> None:
    """Click-drag between two bench slot centers (screen space)."""
    sx, sy = points[src]
    dx, dy = points[dst]
    drag_screen_to_screen(
        client_rect_screen,
        geometry,
        (sx, sy),
        (dx, dy),
        pickup_y_offset=geometry.pickup_y_offset_px,
        drop_y_offset=geometry.drop_y_offset_px,
        timing_scale=timing_scale,
    )


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


def _clamp_bench_timing_scale(value: object) -> float:
    try:
        v = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 1.0
    if v != v:  # NaN
        return 1.0
    return max(0.25, min(4.0, v))


def organize_bench(
    public_player_state: Dict,
    dry_run: bool = False,
    desired_entindex_order: Optional[List[int]] = None,
    timing_scale: float = 1.0,
) -> Dict:
    """
    Organize bench units by rule-based ordering.
    Returns diagnostics and move count.
    """
    dep_error = _dependency_error()
    if dep_error:
        raise BenchOrganizerError(dep_error)

    ts = _clamp_bench_timing_scale(timing_scale)

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
    client_h = max(1, rect[3] - rect[1])
    geometry = _scaled_geometry_for_client_height(client_h)
    points = _slot_points_from_rect(rect, geometry)

    target_order = _resolve_desired_order(bench_units, desired_entindex_order)
    move_plan = _build_move_plan(bench_units, target_order)
    current_order = sorted((u for u in bench_units if 0 <= u.x <= 7), key=lambda unit: unit.x)
    if not dry_run:
        assert win32api is not None
        original_cursor = win32api.GetCursorPos()

        _focus_window(hwnd)
        if SETTLE_AFTER_FOCUS_SEC > 0:
            time.sleep(SETTLE_AFTER_FOCUS_SEC * ts)
        try:
            for i, (src, dst, _unit) in enumerate(move_plan):
                _drag_slot_to_slot(points, src, dst, rect, geometry, timing_scale=ts)
                if i < len(move_plan) - 1 and INTER_DRAG_SETTLE_SEC > 0:
                    time.sleep(INTER_DRAG_SETTLE_SEC * ts)
        finally:
            # Restore mouse cursor to where user last had it.
            win32api.SetCursorPos(original_cursor)

    client_w = max(1, rect[2] - rect[0])
    return {
        "moves_executed": len(move_plan),
        "diagnostics": {
            "dry_run": dry_run,
            "timing_scale": ts,
            "window_handle": hwnd,
            "window_rect": {
                "left": rect[0],
                "top": rect[1],
                "right": rect[2],
                "bottom": rect[3],
            },
            "slot_points": points,
            "bench_geometry": {
                "horizontal_layout": "centered",
                "center_gap_after_slot_index": BENCH_CENTER_GAP_AFTER_SLOT_INDEX,
                "client_center_x": (rect[0] + rect[2]) / 2.0,
                "client_width_px": client_w,
                "row_screen_y": points[0][1] if points else None,
                "client_rect_screen": {"left": rect[0], "top": rect[1], "right": rect[2], "bottom": rect[3]},
                "client_height_px": geometry.client_height_px,
                "reference_client_height_px": geometry.reference_client_height_px,
                "scale": geometry.scale,
                "effective": {
                    "row_from_bottom_px": geometry.row_from_bottom_px,
                    "slot_width_px": geometry.slot_width_px,
                    "slot_gap_px": geometry.slot_gap_px,
                    "slot_pitch_px": geometry.slot_pitch_px,
                    "pickup_y_offset_px": geometry.pickup_y_offset_px,
                    "drop_y_offset_px": geometry.drop_y_offset_px,
                },
                "reference_constants_at_1080h": {
                    "row_from_bottom_px": BENCH_ROW_FROM_BOTTOM_PX,
                    "legacy_left_inset_slot0_x_px": BENCH_SLOT_START_X_PX,
                    "slot_width_px": BENCH_SLOT_WIDTH_PX,
                    "slot_gap_px": BENCH_SLOT_GAP_PX,
                    "pickup_y_offset_px": PICKUP_Y_OFFSET_PX,
                    "drop_y_offset_px": DROP_Y_OFFSET_PX,
                },
                "min_frac_from_top": BENCH_ROW_MIN_FRAC_FROM_TOP,
                "dpi": dpi_info,
            },
            "bench_units": len(bench_units),
            "current_order": [_serialize_unit(unit) for unit in current_order],
            "target_order": [_serialize_unit(unit) for unit in target_order],
            "planned_moves": [{"from_slot": src, "to_slot": dst} for src, dst, _ in move_plan],
        },
    }
