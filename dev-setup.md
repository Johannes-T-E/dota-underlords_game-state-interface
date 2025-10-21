# Development Setup Guide

## Quick Start

### Option 1: Run Both Servers Manually

**Terminal 1 - Backend:**
```bash
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then open http://localhost:5173 in your browser.

### Option 2: Production Mode

Build and run from a single server:

```bash
cd frontend
npm run build
cd ..
set PRODUCTION=true  # On Windows CMD
# OR
$env:PRODUCTION="true"  # On Windows PowerShell
# OR  
export PRODUCTION=true  # On Linux/Mac

python app.py
```

Then open http://localhost:3000 in your browser.

## First Time Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

## Troubleshooting

### CORS Errors in Development
Make sure the Flask server is running on port 3000 and the React dev server is running on port 5173. The Vite config includes a proxy that forwards requests to Flask.

### Build Errors
If you get TypeScript errors, make sure all dependencies are installed:
```bash
cd frontend
npm install
```

### WebSocket Connection Issues
- Check that Flask-SocketIO is installed: `pip install flask-socketio`
- Verify the backend is running on port 3000
- Check browser console for connection errors

