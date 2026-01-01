# Stage 1: Build the React Frontend
FROM node:20-alpine as ui-build
WORKDIR /app/ui
COPY WebApp/damshique-bot-ui/package.json WebApp/damshique-bot-ui/package-lock.json ./
RUN npm install
COPY WebApp/damshique-bot-ui/ ./
RUN npm run build

# Stage 2: Build the Python Backend
FROM python:3.11-slim

# Install system dependencies for OCR and image processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV PYTHONUNBUFFERED=1

# Copy Python requirements first to leverage caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Copy the built frontend from Stage 1 to the location expected by FastAPI
COPY --from=ui-build /app/ui/dist ./WebApp/damshique-bot-ui/dist

# Create necessary directories
RUN mkdir -p exports uploads

# Expose the API/Web port
EXPOSE 3000

# Command to run the application
CMD ["python", "main.py"]
