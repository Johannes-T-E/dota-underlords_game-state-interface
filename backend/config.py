"""Runtime settings for the API and GSI listener."""
import os

from dotenv import load_dotenv

load_dotenv()

DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
AUTO_ABANDON_STALE_MATCHES = os.getenv('AUTO_ABANDON_STALE_MATCHES', 'true').lower() == 'true'
AUTO_ABANDON_STALE_MATCH_MINUTES = int(os.getenv('AUTO_ABANDON_STALE_MATCH_MINUTES', '60'))
GSI_HOST = '0.0.0.0'
GSI_PORT = 3000
