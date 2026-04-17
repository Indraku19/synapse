FROM python:3.11-slim

# Install Node.js 20
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies for 0G Storage upload
COPY zg_upload/ ./zg_upload/
RUN cd zg_upload && npm install

# Copy app
COPY . .

EXPOSE $PORT
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
