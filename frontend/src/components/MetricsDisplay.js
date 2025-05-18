import React from 'react';
import { formatBytes } from '../utils';

export const MetricsDisplay = ({ metrics, isRunning }) => {
    return (
        <div className="bg-white p-4 rounded shadow-md">
            <h2 className="text-xl font-bold mb-4">Traffic Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-500">Current Bandwidth</p>
                    <p className="text-lg font-semibold">{metrics.currentBandwidth.toFixed(2)} Mbps</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Total Data Sent</p>
                    <p className="text-lg font-semibold">{formatBytes(metrics.totalSent)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Elapsed Time</p>
                    <p className="text-lg font-semibold">{metrics.elapsedTime.toFixed(1)} seconds</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`text-lg font-semibold ${isRunning ? 'text-green-600' : 'text-red-600'}`}>
                        {isRunning ? 'Running' : 'Stopped'}
                    </p>
                </div>
            </div>
        </div>
    );
};