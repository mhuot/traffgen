import React, { useEffect, useRef } from 'react';

export const TrafficChart = ({ dataPoints }) => {
    const canvasRef = useRef(null);
    
    useEffect(() => {
        if (!canvasRef.current || dataPoints.length === 0) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear the canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background grid
        ctx.beginPath();
        ctx.strokeStyle = '#eee';
        
        // Vertical grid lines
        for (let i = 0; i <= width; i += 50) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
        }
        
        // Horizontal grid lines
        for (let i = 0; i <= height; i += 25) {
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
        }
        ctx.stroke();
        
        // Find max bandwidth for scaling
        const maxBandwidth = Math.max(...dataPoints.map(p => p.bandwidth), 1);
        
        // Draw axes
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        // X-axis
        ctx.moveTo(0, height - 20);
        ctx.lineTo(width, height - 20);
        
        // Y-axis
        ctx.moveTo(40, 0);
        ctx.lineTo(40, height);
        ctx.stroke();
        
        // Calculate point positions
        const points = dataPoints.map((p, i) => {
            // Use the last 20 points maximum, scaled across the width
            const slicedPoints = dataPoints.slice(-20);
            const pointIndex = slicedPoints.indexOf(p);
            
            if (pointIndex === -1) return null; // Skip if not in last 20
            
            const x = 40 + ((width - 80) * pointIndex / (slicedPoints.length - 1 || 1));
            const y = height - 20 - ((height - 40) * p.bandwidth / maxBandwidth);
            return {x, y};
        }).filter(p => p !== null);
        
        // Draw the line
        if (points.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#4a6cf7';
            ctx.lineWidth = 2;
            ctx.moveTo(points[0].x, points[0].y);
            
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
            
            // Draw points
            points.forEach(p => {
                ctx.beginPath();
                ctx.fillStyle = '#4a6cf7';
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        // Draw labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        
        // Y-axis labels
        ctx.textAlign = 'right';
        ctx.fillText(`${maxBandwidth.toFixed(1)} Mbps`, 35, 15);
        ctx.fillText('0 Mbps', 35, height - 25);
        
        // X-axis labels
        ctx.textAlign = 'center';
        if (dataPoints.length > 0) {
            ctx.fillText('Time (seconds)', width / 2, height - 5);
            
            // Start and end time labels
            const slicedPoints = dataPoints.slice(-20);
            if (slicedPoints.length > 1) {
                ctx.fillText(slicedPoints[0].time, 40, height - 5);
                ctx.fillText(slicedPoints[slicedPoints.length - 1].time, width - 40, height - 5);
            }
        }
        
    }, [dataPoints]);
    
    return (
        <div className="bg-white p-4 rounded shadow-md">
            <h2 className="text-xl font-bold mb-4">Traffic Pattern</h2>
            <div style={{ width: '100%', height: 300, position: 'relative' }}>
                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={250} 
                    style={{ width: '100%', height: '100%' }}
                />
                {dataPoints.length === 0 && (
                    <div style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#666'
                    }}>
                        No data available yet
                    </div>
                )}
            </div>
        </div>
    );
};