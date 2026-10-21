FROM node:22-alpine AS frontend-builder
WORKDIR /website/frontend
COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /website/backend
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app/ ./app/
COPY backend/scripts/ ./scripts/
COPY backend/tests/ ./tests/
RUN python scripts/download_data.py && PYTHONPATH=. python -m pytest tests -q
COPY --from=frontend-builder /website/frontend/dist ./app/web
EXPOSE 10000
CMD ["sh","-c","uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
