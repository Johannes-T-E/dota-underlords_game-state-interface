"""Resolve human names absent from Underlords GSI using public Steam profiles."""

from functools import lru_cache
from xml.etree import ElementTree

import requests

STEAM_ID64_BASE = 76561197960265728


@lru_cache(maxsize=256)
def _steam_persona_name(account_id: int) -> str | None:
    try:
        response = requests.get(
            f'https://steamcommunity.com/profiles/{STEAM_ID64_BASE + account_id}/',
            params={'xml': '1'},
            timeout=3,
        )
        response.raise_for_status()
        name = ElementTree.fromstring(response.content).findtext('steamID')
        return name.strip() if name and name.strip() else None
    except (requests.RequestException, ElementTree.ParseError) as exc:
        print(f'[STEAM] Could not resolve persona name for account {account_id}: {exc}')
        return None


def persona_name(account_id, gsi_name=None, *, is_bot=False) -> str | None:
    """Prefer a name from GSI; look up missing human names by their 32-bit Steam ID."""
    if isinstance(gsi_name, str) and gsi_name.strip():
        return gsi_name
    if is_bot:
        return None
    try:
        account_id = int(account_id)
    except (TypeError, ValueError):
        return None
    if not 0 < account_id < 2**32:
        return None
    return _steam_persona_name(account_id)


def resolve_match_names(matches: list[dict]) -> list[dict]:
    """Fill missing names on historical match responses without changing saved matches."""
    for match in matches:
        for player in match.get('players') or []:
            if not player.get('bot_persona_name'):
                player['persona_name'] = persona_name(player.get('account_id'), player.get('persona_name'))
    return matches
