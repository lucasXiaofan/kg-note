FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml pdm.lock* ./

# Install PDM
RUN pip install --no-cache-dir pdm

# Install dependencies using PDM
RUN pdm install --prod --no-dev

# Copy application code
COPY src/ ./src/
COPY data/ ./data/

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')"

# Start the application
CMD ["pdm", "run", "python", "src/api/api.py", "--host", "0.0.0.0", "--port", "8080"]