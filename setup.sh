#!/bin/bash
set -e

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Network Traffic Generator Setup${NC}"
echo "==============================="
echo ""

# Check if Go is installed
if command -v go &> /dev/null; then
    GO_VERSION=$(go version | awk '{print $3}')
    echo -e "${GREEN}✓${NC} Go is installed: $GO_VERSION"
else
    echo -e "${RED}✗${NC} Go is not installed"
    echo "Please install Go 1.16+ from https://golang.org/dl/"
    echo "Alternatively, you can use Docker to build and run the application."
    if [[ "$1" != "--docker-only" ]]; then
        echo "Rerun this script with --docker-only to skip Go checks."
        exit 1
    fi
fi

# Check if Docker is installed
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}')
    echo -e "${GREEN}✓${NC} Docker is installed: $DOCKER_VERSION"
    DOCKER_AVAILABLE=true
else
    echo -e "${YELLOW}!${NC} Docker is not installed"
    echo "Docker is optional but recommended for containerized deployment."
    DOCKER_AVAILABLE=false
fi

# Check if Node.js is installed (for frontend build)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js is installed: $NODE_VERSION"
    NODE_AVAILABLE=true
else
    echo -e "${YELLOW}!${NC} Node.js is not installed"
    echo "Node.js is recommended for frontend development but not required for Docker deployment."
    NODE_AVAILABLE=false
fi

# Check if npm is installed
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} npm is installed: $NPM_VERSION"
    NPM_AVAILABLE=true
else
    echo -e "${YELLOW}!${NC} npm is not installed"
    echo "npm is recommended for frontend development but not required for Docker deployment."
    NPM_AVAILABLE=false
fi

# Check frontend directory
if [ -d "frontend" ]; then
    echo -e "${GREEN}✓${NC} Frontend directory found"
else
    echo -e "${YELLOW}!${NC} Frontend directory not found, checking for legacy UI file"
    
    # Check for legacy setup (traffic-generator-ui.html)
    if [ -f "traffic-generator-ui.html" ]; then
        echo -e "${YELLOW}!${NC} Legacy UI file found, setting up static directory"
        mkdir -p static
        cp traffic-generator-ui.html static/index.html
        echo -e "${GREEN}✓${NC} Static directory set up with legacy UI file"
    else
        echo -e "${RED}✗${NC} No frontend source found"
        echo "Please ensure either the frontend directory or traffic-generator-ui.html exists"
        exit 1
    fi
fi

# Build frontend if Node.js and npm are available
if [ -d "frontend" ] && [ "$NODE_AVAILABLE" = true ] && [ "$NPM_AVAILABLE" = true ]; then
    echo -e "${YELLOW}!${NC} Building frontend"
    
    # Enter frontend directory and run build
    (cd frontend && npm install && npm run build)
    
    # Exit with error if build failed
    if [ ! -d "frontend/static" ] || [ ! -f "frontend/static/index.html" ]; then
        echo -e "${RED}✗${NC} Frontend build failed or output not found"
        echo -e "\n${RED}FRONTEND BUILD ERROR${NC}"
        echo -e "\nThe webpack build failed or did not produce an index.html file.\n"
        echo -e "${YELLOW}Common issues:${NC}"
        echo -e "  1. Webpack configuration has incorrect output path"
        echo -e "  2. React components have syntax errors"
        echo -e "  3. Missing dependencies in package.json"
        echo -e "  4. HtmlWebpackPlugin is not configured correctly"
        echo -e "\n${YELLOW}Try these steps:${NC}"
        echo -e "  - Run 'cd frontend && npm install && npm run build' to see detailed errors"
        echo -e "  - Check webpack.config.js to ensure output.path is set to 'static'"
        echo -e "  - Verify that your package.json has all needed dependencies"
        echo -e "  - Check for syntax errors in your React components"
        echo -e "  - Run 'cd frontend && npx webpack --display-error-details' for verbose output\n"
        exit 1
    fi
    
    echo -e "${GREEN}✓${NC} Frontend built successfully"
    
    # Ensure the static directory is set up properly
    mkdir -p static
    cp -r frontend/static/* static/
    echo -e "${GREEN}✓${NC} Copied frontend build to static directory"
elif [ -d "frontend" ]; then
    echo -e "${YELLOW}!${NC} Skipping frontend build (Node.js or npm not available)"
    echo "Use Docker deployment to build the frontend without local Node.js"
fi

# Only run Go-specific setup if not in docker-only mode
if [[ "$1" != "--docker-only" ]]; then
    # Initialize Go modules if needed
    if [ ! -f "go.mod" ] || [ ! -f "go.sum" ]; then
        echo -e "${YELLOW}!${NC} Initializing Go modules"
        if [ ! -f "go.mod" ]; then
            go mod init github.com/user/traffic-generator
        fi
        go mod tidy
    else
        echo -e "${GREEN}✓${NC} Go modules already initialized"
    fi

    # Ensure main.go exists
    if [ ! -f "main.go" ] && [ -f "traffic-generator-code.go" ]; then
        echo -e "${YELLOW}!${NC} Creating main.go from traffic-generator-code.go"
        cp traffic-generator-code.go main.go
    fi
fi

echo ""
echo -e "${GREEN}Setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT:${NC} Before starting the traffic generator, make sure you have a UDP listener"
echo "running on your target system. The default target is 127.0.0.1:8080."
echo ""
echo "Choose how to run the application:"
echo ""
echo "1) Run directly with Go"
echo "2) Build and run with Docker"
echo "3) Setup a UDP listener on this machine (requires netcat)"
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        if [[ "$1" == "--docker-only" ]]; then
            echo -e "${RED}Cannot run with Go in docker-only mode${NC}"
            exit 1
        fi
        echo "Starting the application with Go..."
        go run main.go
        ;;
    2)
        if [ "$DOCKER_AVAILABLE" = true ]; then
            echo "Building Docker image..."
            docker build -t traffic-generator .
            echo "Running Docker container..."
            docker run -p 8000:8000 traffic-generator
        else
            echo -e "${RED}Docker is not installed${NC}"
            exit 1
        fi
        ;;
    3)
        if command -v nc &> /dev/null; then
            echo "Starting UDP listener on port 8080..."
            echo "Press Ctrl+C to stop the listener."
            echo "--------------------------------"
            nc -ul 8080
        else
            echo -e "${RED}Netcat (nc) is not installed${NC}"
            echo "Please install netcat or use one of these alternatives:"
            echo ""
            echo "Python:"
            echo 'python3 -c "import socket; s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.bind((\"0.0.0.0\", 8080)); print(\"Listening on port 8080...\"); \
while True: \
    try: \
        data, addr = s.recvfrom(9000); \
        print(f\"Received {len(data)} bytes from {addr}\"); \
    except KeyboardInterrupt: \
        print(\"\\nExiting...\"); \
        break"'
            echo ""
            echo "Socat:"
            echo "socat UDP-LISTEN:8080,fork /dev/null"
        fi
        ;;
    4)
        echo "Exiting setup."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac