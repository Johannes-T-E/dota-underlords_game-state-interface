"""
Configuration & Environment Setup
"""
import os
from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS

# Configuration from environment variables
DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'
SECRET_KEY = os.getenv('SECRET_KEY', 'underlords_gsi_secret_key')
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# GSI endpoint is fixed by game configuration
GSI_HOST = '0.0.0.0'  # Must match game's GSI config
GSI_PORT = 3000       # Must match game's GSI config

# Client owner identification (the player running this GSI client)
PRIVATE_PLAYER_ACCOUNT_ID = 249722568  # int to match account_id type

# Determine if we're in production or development
PRODUCTION = os.getenv('PRODUCTION', 'false').lower() == 'true'
FRONTEND_BUILD_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')

# Flask app setup
if PRODUCTION and os.path.exists(FRONTEND_BUILD_DIR):
    # Production: serve React from dist folder
    app = Flask(__name__, 
                static_folder=FRONTEND_BUILD_DIR, 
                static_url_path='')
else:
    # Development: use default Flask setup (React runs separately)
    app = Flask(__name__)
    # Enable CORS for development (React dev server runs on different port)
    CORS(app, 
         resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"], 
                           "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                           "allow_headers": ["Content-Type", "Authorization"]}})

app.config['SECRET_KEY'] = SECRET_KEY
socketio = SocketIO(
    app, 
    cors_allowed_origins="*",
    async_mode='threading',  # Explicit async mode
    logger=DEBUG,  # Enable SocketIO logging in debug mode
    engineio_logger=DEBUG  # Enable engineio logging in debug mode
)

