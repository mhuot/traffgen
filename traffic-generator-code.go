package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// Configuration holds the traffic generation parameters
type Configuration struct {
	Pattern       string  `json:"pattern"`       // "bell", "constant", "random"
	Duration      int     `json:"duration"`      // Duration in seconds
	MaxBandwidth  int     `json:"maxBandwidth"`  // Max bandwidth in Mbps
	TargetIP      string  `json:"targetIP"`      // Target IP address
	TargetPort    int     `json:"targetPort"`    // Target port
	BellPeakRatio float64 `json:"bellPeakRatio"` // Position of peak in bell curve (0-1)
	PacketSize    int     `json:"packetSize"`    // Size of each packet in bytes
}

// Generator manages traffic generation
type Generator struct {
	Config     Configuration
	IsRunning  bool
	StopChan   chan struct{}
	Metrics    Metrics
	MetricsMux sync.Mutex
	Clients    map[*websocket.Conn]bool
	ClientsMux sync.Mutex
}

// Metrics for traffic statistics
type Metrics struct {
	CurrentBandwidth float64   `json:"currentBandwidth"` // Current bandwidth in Mbps
	TotalSent        int64     `json:"totalSent"`        // Total bytes sent
	StartTime        time.Time `json:"startTime"`        // Start time of generation
	ElapsedTime      float64   `json:"elapsedTime"`      // Elapsed time in seconds
}

var (
	generator = &Generator{
		Config: Configuration{
			Pattern:       "bell",
			Duration:      60,
			MaxBandwidth:  100,
			TargetIP:      "127.0.0.1",
			TargetPort:    8080,
			BellPeakRatio: 0.5,
			PacketSize:    1400,
		},
		IsRunning: false,
		StopChan:  make(chan struct{}),
		Clients:   make(map[*websocket.Conn]bool),
	}
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin:     func(r *http.Request) bool { return true }, // Allow all origins
	}
)

// calculateBandwidth determines the current bandwidth based on pattern and elapsed time
func calculateBandwidth(config Configuration, elapsedSec float64) float64 {
	totalSec := float64(config.Duration)
	maxBandwidth := float64(config.MaxBandwidth)

	switch config.Pattern {
	case "constant":
		return maxBandwidth

	case "bell":
		// Bell curve (normal distribution)
		peakTime := totalSec * config.BellPeakRatio
		// Standard deviation as a fraction of the total duration
		stdDev := totalSec / 5
		
		// Calculate height at current position using normal distribution formula
		exponent := -0.5 * math.Pow((elapsedSec-peakTime)/stdDev, 2)
		height := math.Exp(exponent)
		
		// Scale height to max bandwidth
		return maxBandwidth * height

	case "random":
		// Random fluctuation between 20% and 100% of max
		randomFactor := 0.2 + 0.8*math.Sin(elapsedSec*10)*math.Sin(elapsedSec*3.3)*math.Sin(elapsedSec*7.7)
		return maxBandwidth * (0.2 + 0.8*math.Abs(randomFactor))

	default:
		return maxBandwidth / 2
	}
}

// generateTraffic sends network traffic according to the configured pattern
func (g *Generator) generateTraffic() {
	// Connect to target
	addr := fmt.Sprintf("%s:%d", g.Config.TargetIP, g.Config.TargetPort)
	conn, err := net.Dial("udp", addr)
	if err != nil {
		log.Printf("Error connecting to target: %v", err)
		return
	}
	defer conn.Close()

	// Create a buffer of configured packet size
	data := make([]byte, g.Config.PacketSize)
	for i := range data {
		data[i] = byte(i % 256) // Fill with some pattern
	}

	startTime := time.Now()
	g.MetricsMux.Lock()
	g.Metrics = Metrics{
		StartTime: startTime,
	}
	g.MetricsMux.Unlock()

	ticker := time.NewTicker(100 * time.Millisecond) // Update 10 times per second
	defer ticker.Stop()

	for {
		select {
		case <-g.StopChan:
			return
		case <-ticker.C:
			elapsed := time.Since(startTime).Seconds()
			if elapsed > float64(g.Config.Duration) {
				g.stop()
				return
			}

			// Calculate current bandwidth based on pattern
			currentBandwidth := calculateBandwidth(g.Config, elapsed)
			
			// Convert Mbps to bytes per 100ms interval
			bytesPerInterval := int(currentBandwidth * 1000000 / 8 / 10)
			packetsToSend := bytesPerInterval / g.Config.PacketSize
			
			// Send the calculated number of packets
			bytesSent := 0
			for i := 0; i < packetsToSend; i++ {
				n, err := conn.Write(data)
				if err != nil {
					log.Printf("Error sending data: %v", err)
					return
				}
				bytesSent += n
			}

			// Update metrics
			g.MetricsMux.Lock()
			g.Metrics.CurrentBandwidth = currentBandwidth
			g.Metrics.TotalSent += int64(bytesSent)
			g.Metrics.ElapsedTime = elapsed
			metrics := g.Metrics // Copy to avoid race conditions
			g.MetricsMux.Unlock()

			// Broadcast metrics to WebSocket clients
			g.broadcastMetrics(metrics)
		}
	}
}

// broadcastMetrics sends current metrics to all connected WebSocket clients
func (g *Generator) broadcastMetrics(metrics Metrics) {
	metricsJSON, err := json.Marshal(metrics)
	if err != nil {
		log.Printf("Error marshaling metrics: %v", err)
		return
	}

	g.ClientsMux.Lock()
	defer g.ClientsMux.Unlock()

	for client := range g.Clients {
		err := client.WriteMessage(websocket.TextMessage, metricsJSON)
		if err != nil {
			log.Printf("Error sending to client: %v", err)
			client.Close()
			delete(g.Clients, client)
		}
	}
}

// start begins traffic generation
func (g *Generator) start() error {
	if g.IsRunning {
		return fmt.Errorf("traffic generation already running")
	}

	g.IsRunning = true
	g.StopChan = make(chan struct{})
	go g.generateTraffic()
	return nil
}

// stop ends traffic generation
func (g *Generator) stop() {
	if !g.IsRunning {
		return
	}

	g.StopChan <- struct{}{}
	g.IsRunning = false
}

// handleWebSocket handles WebSocket connections for real-time metrics
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading to WebSocket: %v", err)
		return
	}

	// Register client
	generator.ClientsMux.Lock()
	generator.Clients[conn] = true
	generator.ClientsMux.Unlock()

	// Send current config and status immediately
	type InitialState struct {
		Config    Configuration `json:"config"`
		IsRunning bool          `json:"isRunning"`
		Metrics   Metrics       `json:"metrics"`
	}

	generator.MetricsMux.Lock()
	initialState := InitialState{
		Config:    generator.Config,
		IsRunning: generator.IsRunning,
		Metrics:   generator.Metrics,
	}
	generator.MetricsMux.Unlock()

	initialJSON, err := json.Marshal(initialState)
	if err == nil {
		conn.WriteMessage(websocket.TextMessage, initialJSON)
	}

	// Handle incoming messages (configuration updates)
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			generator.ClientsMux.Lock()
			delete(generator.Clients, conn)
			generator.ClientsMux.Unlock()
			break
		}

		var newConfig Configuration
		err = json.Unmarshal(message, &newConfig)
		if err != nil {
			log.Printf("Error parsing config: %v", err)
			continue
		}

		// Apply new configuration
		if !generator.IsRunning {
			generator.Config = newConfig
			// Broadcast config update to all clients
			configJSON, _ := json.Marshal(newConfig)
			generator.broadcastToAll(configJSON)
		}
	}
}

// broadcastToAll sends a message to all WebSocket clients
func (g *Generator) broadcastToAll(message []byte) {
	g.ClientsMux.Lock()
	defer g.ClientsMux.Unlock()

	for client := range g.Clients {
		err := client.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			log.Printf("Error sending to client: %v", err)
			client.Close()
			delete(g.Clients, client)
		}
	}
}

// API handlers
func getConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(generator.Config)
}

func updateConfig(w http.ResponseWriter, r *http.Request) {
	if generator.IsRunning {
		http.Error(w, "Cannot update configuration while running", http.StatusBadRequest)
		return
	}

	var newConfig Configuration
	err := json.NewDecoder(r.Body).Decode(&newConfig)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	generator.Config = newConfig
	w.WriteHeader(http.StatusOK)
}

func startGenerator(w http.ResponseWriter, r *http.Request) {
	err := generator.start()
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func stopGenerator(w http.ResponseWriter, r *http.Request) {
	generator.stop()
	w.WriteHeader(http.StatusOK)
}

func getStatus(w http.ResponseWriter, r *http.Request) {
	generator.MetricsMux.Lock()
	status := struct {
		IsRunning bool    `json:"isRunning"`
		Metrics   Metrics `json:"metrics"`
	}{
		IsRunning: generator.IsRunning,
		Metrics:   generator.Metrics,
	}
	generator.MetricsMux.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

func main() {
	router := mux.NewRouter()

	// API Endpoints
	router.HandleFunc("/api/config", getConfig).Methods("GET")
	router.HandleFunc("/api/config", updateConfig).Methods("POST")
	router.HandleFunc("/api/start", startGenerator).Methods("POST")
	router.HandleFunc("/api/stop", stopGenerator).Methods("POST")
	router.HandleFunc("/api/status", getStatus).Methods("GET")
	router.HandleFunc("/ws", handleWebSocket)

	// Serve static files for the web UI
	router.PathPrefix("/").Handler(http.FileServer(http.Dir("./static")))

	// Start HTTP server
	fmt.Println("Starting traffic generator server on :8000")
	log.Fatal(http.ListenAndServe(":8000", router))
}
