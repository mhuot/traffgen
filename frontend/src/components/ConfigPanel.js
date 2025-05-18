import React, { useState, useEffect } from 'react';

export const ConfigPanel = ({ config, setConfig, isRunning }) => {
    const [localConfig, setLocalConfig] = useState(config);

    useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let parsedValue = value;
        
        // Parse numeric values
        if (name !== 'pattern' && name !== 'targetIP') {
            parsedValue = name === 'bellPeakRatio' ? parseFloat(value) : parseInt(value, 10);
        }
        
        setLocalConfig({ ...localConfig, [name]: parsedValue });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setConfig(localConfig);
        
        // Send config to server
        fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(localConfig),
        });
    };

    return (
        <div className="bg-white p-4 rounded shadow-md">
            <h2 className="text-xl font-bold mb-4">Traffic Configuration</h2>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pattern</label>
                        <select 
                            name="pattern"
                            value={localConfig.pattern}
                            onChange={handleChange}
                            disabled={isRunning}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="bell">Bell Curve</option>
                            <option value="constant">Constant</option>
                            <option value="random">Random</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Duration (seconds)</label>
                        <input 
                            type="number" 
                            name="duration"
                            min="1"
                            max="3600"
                            value={localConfig.duration}
                            onChange={handleChange}
                            disabled={isRunning}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Max Bandwidth (Mbps)</label>
                        <input 
                            type="number" 
                            name="maxBandwidth"
                            min="1"
                            max="10000"
                            value={localConfig.maxBandwidth}
                            onChange={handleChange}
                            disabled={isRunning}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Target IP</label>
                        <input 
                            type="text" 
                            name="targetIP"
                            value={localConfig.targetIP}
                            onChange={handleChange}
                            disabled={isRunning}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Target Port</label>
                        <input 
                            type="number" 
                            name="targetPort"
                            min="1"
                            max="65535"
                            value={localConfig.targetPort}
                            onChange={handleChange}
                            disabled={isRunning}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                    </div>
                    
                    {localConfig.pattern === 'bell' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Bell Peak Position (0-1)</label>
                            <input 
                                type="number" 
                                name="bellPeakRatio"
                                min="0"
                                max="1"
                                step="0.1"
                                value={localConfig.bellPeakRatio}
                                onChange={handleChange}
                                disabled={isRunning}
                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Packet Size (bytes)</label>
                        <input 
                            type="number" 
                            name="packetSize"
                            min="64"
                            max="9000"
                            value={localConfig.packetSize}
                            onChange={handleChange}
                            disabled={isRunning}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                    </div>
                </div>
                
                <div className="mt-4">
                    <button
                        type="submit"
                        disabled={isRunning}
                        className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isRunning ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        Apply Configuration
                    </button>
                </div>
            </form>
        </div>
    );
};