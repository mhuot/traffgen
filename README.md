# Network Traffic Generator

A configurable network traffic generator with web UI for testing Network Performance Monitoring (NPM) tools.

## Features

- Generate real network traffic with configurable patterns:
  - Bell curve (normal distribution)
  - Constant rate
  - Random fluctuations
- Web UI for easy configuration and monitoring
- Real-time visualization of traffic patterns
- Standalone operation with minimal dependencies
- Container-ready for easy deployment

## Architecture

The application consists of two main components:

1. **Go Backend**: Handles traffic generation and API (written in Go)
2. **Web UI**: React-based frontend for configuration and monitoring (built with React and Webpack)

The frontend uses proper dependency management with npm and builds a production bundle with Webpack. This approach:
- Ensures consistent dependency versions
- Optimizes JavaScript for production
- Bundles all assets locally (no external CDN connections)
- Provides a modern development workflow

## How to Build and Run

### Prerequisites

- Go 1.16+ (for backend development)
- Node.js 18+ and npm (for frontend development)
- Docker (for containerized deployment, can build without Go or Node.js installed)

### Local Development

1. Clone the repository
2. Run the setup script (which handles both backend and frontend setup):

```bash
./setup.sh
```

3. Or manually set up:

   **Backend:**
   ```bash
   go mod tidy
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

4. Run the application:

```bash
go run main.go
```

5. Access the web UI at http://localhost:8000

### Frontend Development

For active frontend development, you can use the watch mode:

```bash
cd frontend
npm install
npm run dev
```

This will automatically rebuild the frontend when files change.

### Docker Deployment

1. Build the Docker image:

```bash
docker build -t traffic-generator .
```

2. Run the container:

```bash
docker run -p 8000:8000 traffic-generator
```

3. Access the web UI at http://localhost:8000

### Running on Network Devices

For deployment on network devices:

1. Build for the target architecture:

```bash
GOOS=linux GOARCH=arm64 go build -o traffic-generator
```

2. Copy the binary and `static` directory to the device
3. Run the binary on the device

## Usage Guide

1. Configure the traffic pattern, duration, and bandwidth
2. Set the target IP and port (the target should be running a service that can receive UDP traffic)
3. Click "Apply Configuration" to save settings
4. Press "Start" to begin generating traffic
5. Monitor the real-time traffic graph and metrics
6. Traffic will automatically stop after the configured duration

## Configuration Options

- **Pattern**: Traffic distribution pattern (bell curve, constant, random)
- **Duration**: How long to generate traffic (in seconds)
- **Max Bandwidth**: Maximum bandwidth to generate (in Mbps)
- **Target IP**: Destination IP address
- **Target Port**: Destination port number
- **Bell Peak Ratio**: For bell curve pattern, position of peak (0-1)
- **Packet Size**: Size of each packet in bytes

## Target Setup

The traffic generator sends UDP packets to the specified target IP and port. To properly receive this traffic, you should set up a UDP listener on the target system:

### Setting Up a UDP Listener

#### Option 1: Using netcat (nc)
```bash
# On Linux/macOS
nc -ul 8080

# On Windows (if netcat is available)
nc -ul 8080
```

#### Option 2: Using socat
```bash
socat UDP-LISTEN:8080,fork /dev/null
```

#### Option 3: Simple Python UDP receiver
```python
import socket

# Create a UDP socket
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# Bind the socket to address and port
server_address = ('0.0.0.0', 8080)
sock.bind(server_address)

print(f'Starting UDP listener on port {server_address[1]}')

# Receive loop
try:
    while True:
        data, address = sock.recvfrom(9000)
        print(f'Received {len(data)} bytes from {address}')
except KeyboardInterrupt:
    print('Shutting down')
finally:
    sock.close()
```

### Important Considerations

- Make sure your firewall allows incoming UDP traffic on the configured port
- If running the traffic generator across different machines, use the actual IP address of the target, not 127.0.0.1
- The target system must be able to handle the amount of traffic generated (especially at higher bandwidth settings)
- For testing NPM tools, ensure the traffic flows through interfaces that are being monitored
- No special software is needed on the target - it just needs to be able to receive UDP packets

## Example NPM Testing Scenarios

1. **Bell Curve Traffic Test**: Configure a bell curve with a 5-minute duration to simulate natural traffic patterns and observe how the NPM tools handle the gradual increase and decrease.

2. **Max Bandwidth Test**: Set a constant pattern at the maximum bandwidth of your link to test how NPM tools handle saturation conditions.

3. **Random Fluctuation Test**: Use the random pattern to test how NPM tools respond to unpredictable traffic spikes.

## License

MIT
