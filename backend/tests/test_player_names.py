"""Regression checks for GSI names missing from human player states."""

import unittest
from datetime import datetime
from unittest.mock import patch

from backend.infrastructure.database import UnderlordsDatabaseManager
from backend.service.player_names import _steam_persona_name, persona_name, resolve_match_names


class PlayerNameTests(unittest.TestCase):
    def setUp(self):
        _steam_persona_name.cache_clear()

    @patch('backend.service.player_names.requests.get')
    def test_missing_human_name_is_loaded_as_utf8_and_cached(self, get):
        get.return_value.content = '<profile><steamID>Фотограф Ёж</steamID></profile>'.encode('utf-8')

        self.assertEqual(persona_name(331169351), 'Фотограф Ёж')
        self.assertEqual(persona_name(331169351), 'Фотограф Ёж')
        get.assert_called_once_with(
            'https://steamcommunity.com/profiles/76561198291435079/',
            params={'xml': '1'}, timeout=3,
        )

    @patch('backend.service.player_names.requests.get')
    def test_gsi_name_and_bots_do_not_trigger_steam_lookup(self, get):
        self.assertEqual(persona_name(331169351, 'Игрок'), 'Игрок')
        self.assertIsNone(persona_name(12335000, is_bot=True))
        get.assert_not_called()

    @patch('backend.service.player_names.requests.get')
    def test_existing_match_with_missing_name_is_displayed(self, get):
        get.return_value.content = '<profile><steamID>Фотограф</steamID></profile>'.encode('utf-8')
        db = UnderlordsDatabaseManager(':memory:')
        try:
            db.create_match('match', [
                {'account_id': 331169351, 'is_human_player': True, 'player_slot': 1},
                {'account_id': 1, 'is_human_player': False, 'bot_persona_name': '#DAC_BotName_18'},
            ], datetime.now())
            matches = resolve_match_names(db.get_all_matches())
            names = {player['account_id']: player['persona_name'] for player in matches[0]['players']}
            self.assertEqual(names[331169351], 'Фотограф')
            bot = next(player for player in matches[0]['players'] if player['bot_persona_name'])
            self.assertIsNone(bot['persona_name'])
            get.assert_called_once()
        finally:
            db.close()


if __name__ == '__main__':
    unittest.main()
