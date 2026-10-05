FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (build-essential, libpq-dev for PostgreSQL adapter)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

# Create uploads directory and data directory for SQLite
RUN mkdir -p /app/uploads /app/data

ENV DATABASE_URL="sqlite:////app/data/omnispace.db"
ENV UPLOAD_DIR="/app/uploads"
ENV PORT=8000

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
