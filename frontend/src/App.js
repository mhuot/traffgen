import React, { useState, useEffect, useRef } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { TrafficChart } from './components/TrafficChart';
import { MetricsDisplay } from './components/MetricsDisplay';

const App = () => {
    const [config, setConfig] = useState({
        pattern: 'bell',
        duration: 60,
        maxBandwidth: 100,
        targetIP: '127.0.0.1',
        targetPort: 8080,
        bellPeakRatio: 0.5,
        packetSize: 1400
    });
    const [isRunning, setIsRunning] = useState(false);
    const [metrics, setMetrics] = useState({
        currentBandwidth: 0,
        totalSent: 0,
        elapsedTime: 0
    });
    const [dataPoints, setDataPoints] = useState([]);
    const ws = useRef(null);

    // Connect to WebSocket for real-time updates
    useEffect(() => {
        const connectWebSocket = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            ws.current = new WebSocket(wsUrl);
            
            ws.current.onopen = () => {
                console.log('WebSocket connected');
            };
            
            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                // Check if we received initial state
                if (data.config) {
                    setConfig(data.config);
                    setIsRunning(data.isRunning);
                    setMetrics(data.metrics);
                } 
                // Regular metrics update
                else if (data.currentBandwidth !== undefined) {
                    setMetrics(data);
                    setDataPoints(prevPoints => {
                        const newPoints = [...prevPoints, {
                            time: data.elapsedTime.toFixed(1),
                            bandwidth: parseFloat(data.currentBandwidth.toFixed(2))
                        }];
                        
                        // Keep only the last 100 points to avoid performance issues
                        if (newPoints.length > 100) {
                            return newPoints.slice(-100);
                        }
                        return newPoints;
                    });
                }
            };
            
            ws.current.onclose = () => {
                console.log('WebSocket disconnected, trying to reconnect...');
                setTimeout(connectWebSocket, 2000);
            };
            
            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        };
        
        connectWebSocket();
        
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    // Start traffic generation
    const handleStart = () => {
        fetch('/api/start', { method: 'POST' })
            .then(response => {
                if (response.ok) {
                    setIsRunning(true);
                    setDataPoints([]);
                }
            })
            .catch(error => console.error('Error starting generator:', error));
    };

    // Stop traffic generation
    const handleStop = () => {
        fetch('/api/stop', { method: 'POST' })
            .then(response => {
                if (response.ok) {
                    setIsRunning(false);
                }
            })
            .catch(error => console.error('Error stopping generator:', error));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Network Traffic Generator</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <ConfigPanel config={config} setConfig={setConfig} isRunning={isRunning} />
                    
                    <div className="mt-6 bg-white p-4 rounded shadow-md">
                        <h2 className="text-xl font-bold mb-4">Controls</h2>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleStart}
                                disabled={isRunning}
                                className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isRunning ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                Start
                            </button>
                            <button
                                onClick={handleStop}
                                disabled={!isRunning}
                                className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${!isRunning ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                Stop
                            </button>
                        </div>
                    </div>
                    
                    <MetricsDisplay metrics={metrics} isRunning={isRunning} />
                </div>
                
                <div className="lg:col-span-2">
                    <TrafficChart dataPoints={dataPoints} />
                    
                    <div className="mt-6 bg-white p-4 rounded shadow-md">
                        <h2 className="text-xl font-bold mb-4">How to Use</h2>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Configure your traffic pattern, duration, and bandwidth</li>
                            <li>Set the target IP and port (should be listening for UDP traffic)</li>
                            <li>Click "Apply Configuration" to save settings</li>
                            <li>Press "Start" to begin generating traffic</li>
                            <li>Monitor the real-time traffic graph and metrics</li>
                            <li>The traffic will automatically stop after the configured duration</li>
                        </ol>
                        <div className="mt-4 p-3 bg-yellow-50 rounded">
                            <p className="text-yellow-700">
                                <strong>Note:</strong> This tool generates real network traffic. 
                                Make sure your target system is ready to receive the traffic and 
                                your network can handle the configured bandwidth.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;