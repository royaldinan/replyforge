import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Toaster } from 'sonner';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      theme="dark"
      toastOptions={{
        style: {
          background: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#F3F4F6',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        },
      }}
    />
  </React.StrictMode>
);
