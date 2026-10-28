# Development setup

## Docker Compose (recommended)

From the project root:

```bash
docker compose up --build -d
```

Open http://localhost:3000. API documentation is available at http://localhost:3000/docs. Run `docker compose down` to stop the application.

## Local development with Vite HMR

Install Python dependencies from the project root (`pip install -r requirements.txt`), then start the backend:

```bash
python -m backend.app
```

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. Vite proxies `/api`, `/upload` and `/socket.io` to the backend on port 3000. Run the backend directly on Windows if you need host desktop control for the bench organizer.
