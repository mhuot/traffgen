FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package.json and package-lock.json
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN mkdir -p static && npm run build || (echo -e "\n\n\033[0;31mFRONTEND BUILD ERROR\033[0m" && \
    echo -e "\nThe webpack build failed. Check the error messages above.\n" && \
    echo -e "Common frontend build issues:" && \
    echo -e "  1. Syntax errors in JavaScript/JSX code" && \
    echo -e "  2. Missing dependencies" && \
    echo -e "  3. Webpack configuration errors" && \
    echo -e "  4. Incorrect import paths\n" && exit 1)

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

# Verify that frontend built successfully
RUN test -f /app/static/index.html || (echo -e "\n\n\033[0;31mFRONTEND BUILD ERROR\033[0m" && \
    echo -e "\nThe frontend build failed or did not produce an index.html file.\n" && \
    echo -e "Common issues:" && \
    echo -e "  1. Webpack configuration has incorrect output path" && \
    echo -e "  2. React components have syntax errors" && \
    echo -e "  3. Missing dependencies in package.json" && \
    echo -e "\nTry these steps to debug:" && \
    echo -e "  - Run 'cd frontend && npm install && npm run build' locally" && \
    echo -e "  - Check webpack.config.js to ensure output.path is set to 'static'" && \
    echo -e "  - Verify that HtmlWebpackPlugin is configured correctly" && \
    echo -e "  - Check for syntax errors in your React components\n" && exit 1)

# Expose API port
EXPOSE 8000

# Run the application
WORKDIR /app
CMD ["./traffic-generator"]
