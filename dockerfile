FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package.json and package-lock.json
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

FROM golang:1.21-alpine AS backend-builder

WORKDIR /app

# Copy go.mod file
COPY go.mod ./

# Initialize empty go.sum if it doesn't exist
RUN touch go.sum

# Copy source code (only main.go)
COPY main.go ./

# Add missing dependencies and build
RUN go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build -o traffic-generator main.go

# Create a minimal runtime image
FROM alpine:latest

WORKDIR /app

# Copy the binary from the backend builder stage
COPY --from=backend-builder /app/traffic-generator /app/

# Create static directory
RUN mkdir -p /app/static

# Copy built frontend files from frontend builder stage
COPY --from=frontend-builder /app/frontend/static/ /app/static/

# Expose API port
EXPOSE 8000

# Run the application
WORKDIR /app
CMD ["./traffic-generator"]
