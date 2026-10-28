FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ backend/

EXPOSE 3000
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "3000"]
