import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles.css';

// Render app with error handling
try {
    console.log('Rendering app...');
    ReactDOM.render(<App />, document.getElementById('root'));
    console.log('App rendered successfully');
} catch (error) {
    console.error('Error rendering app:', error);
    document.getElementById('root').innerHTML = `
        <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
            <h1>Network Traffic Generator</h1>
            <p>Error loading the React application. Please check the console for details.</p>
            <p>This could be due to issues with loading the React libraries or processing JSX.</p>
            <h2>Basic Interface</h2>
            <div style="margin-top: 20px; border: 1px solid #ccc; padding: 15px; border-radius: 5px;">
                <h3>API Endpoints</h3>
                <ul>
                    <li><a href="/api/config">/api/config</a> - Get current configuration</li>
                    <li>POST to /api/start - Start traffic generation</li>
                    <li>POST to /api/stop - Stop traffic generation</li>
                    <li><a href="/api/status">/api/status</a> - Get generator status</li>
                </ul>
            </div>
        </div>
    `;
}