import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { initializeServices } from './services';
import './index.css';

// Initialize services before rendering
initializeServices().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch((error) => {
  console.error('Failed to initialize services:', error);
  // Show error UI
  document.getElementById('root')!.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
      <div style="text-align: center;">
        <h1 style="color: #ff4444;">Failed to initialize app</h1>
        <p style="color: #666;">Please refresh the page or check the console for details.</p>
      </div>
    </div>
  `;
});
