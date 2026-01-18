// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import this
import App from './App';

// Add overflow hidden to prevent scrolling
const root = document.getElementById('root')!;
root.style.overflow = 'hidden';
root.style.height = '100vh';

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter> {/* Wrap App with this */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);