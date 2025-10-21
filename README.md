# Underlords GSI Unified

A real-time scoreboard and match tracker for Dota Underlords using the Game State Integration (GSI) API.

## Features

- Real-time match tracking with WebSocket updates
- Live scoreboard with player stats, units, and synergies
- Match history management
- Modern React + TypeScript frontend
- Flask backend with SQLite database

## Tech Stack

### Backend
- Python 3.x
- Flask + Flask-SocketIO
- SQLite database

### Frontend
- React 19
- TypeScript
- Redux Toolkit (state management)
- React Router (navigation)
- Socket.IO Client (WebSocket)
- Vite (build tool)

## Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

## Running the Application

### Development Mode (Recommended for Development)

Run both servers in separate terminals:

**Terminal 1 - Flask Backend:**
```bash
python app.py
```
This starts the Flask server on `http://localhost:3000`

**Terminal 2 - React Frontend:**
```bash
cd frontend
npm run dev
```
This starts the Vite dev server on `http://localhost:5173`

Open `http://localhost:5173` in your browser for the React app with Hot Module Replacement (HMR).

### Production Mode

Build the React app and serve it from Flask:

```bash
# Build the React app
cd frontend
npm run build
cd ..

# Run Flask with production flag
PRODUCTION=true python app.py
```

Open `http://localhost:3000` in your browser.

## Project Structure

```
underlords_gsi_unified/
├── app.py                      # Flask backend server
├── database.py                 # Database management
├── requirements.txt            # Python dependencies
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Scoreboard/     # Scoreboard components
│   │   │   └── MatchManagement/# Match management components
│   │   ├── pages/              # Page components
│   │   │   ├── Scoreboard.tsx  # Main scoreboard page
│   │   │   └── Matches.tsx     # Match management page
│   │   ├── store/              # Redux store
│   │   │   ├── store.ts        # Store configuration
│   │   │   ├── matchSlice.ts   # Match state
│   │   │   ├── connectionSlice.ts # WebSocket connection
│   │   │   └── matchesSlice.ts # Matches list
│   │   ├── services/           # API & WebSocket services
│   │   │   ├── api.ts          # REST API client
│   │   │   └── websocket.ts    # WebSocket client
│   │   ├── hooks/              # Custom hooks
│   │   │   └── redux.ts        # Typed Redux hooks
│   │   ├── types/              # TypeScript types
│   │   │   └── index.ts        # Type definitions
│   │   ├── styles/             # CSS files
│   │   ├── App.tsx             # Main App component
│   │   └── main.tsx            # Entry point
│   ├── public/                 # Static assets
│   │   ├── icons/              # Hero & UI icons
│   │   └── underlords_heroes.json
│   ├── package.json
│   ├── vite.config.ts          # Vite configuration
│   └── tsconfig.json           # TypeScript configuration
├── static/                     # Legacy static files (deprecated)
├── templates/                  # Legacy templates (deprecated)
└── underlords_gsi_v2.db       # SQLite database
```

## API Endpoints

- `POST /upload` - GSI data endpoint (receives game data)
- `GET /api/status` - System status
- `GET /api/health` - Health check
- `GET /api/matches` - List all matches
- `DELETE /api/matches/:id` - Delete a match
- `POST /api/abandon_match` - Abandon current match

## WebSocket Events

### Client → Server
- `test_connection` - Test WebSocket connection

### Server → Client
- `connection_response` - Connection confirmation
- `match_update` - Real-time match data updates
- `match_abandoned` - Match abandonment notification
- `test_response` - Test response

## Development Notes

### CORS Configuration
In development mode, Flask is configured to allow CORS from `http://localhost:5173` (Vite dev server).

### Proxy Configuration
The Vite dev server proxies API requests and WebSocket connections to Flask on port 3000.

### Hot Module Replacement
In development mode, the React app supports HMR for instant feedback on code changes.

## Building for Production

```bash
cd frontend
npm run build
```

This creates an optimized production build in `frontend/dist/` that Flask can serve.

## Environment Variables

- `DEBUG` - Enable Flask debug mode (default: `true`)
- `PRODUCTION` - Enable production mode to serve React build (default: `false`)
- `SECRET_KEY` - Flask secret key
- `LOG_LEVEL` - Logging level

## License

MIT

