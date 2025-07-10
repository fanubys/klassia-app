import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// --- Service Worker Registration ---
// The registration logic is wrapped in the 'load' event to ensure the page is fully loaded,
// preventing the "InvalidStateError".
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    // Construct an absolute URL for the service worker to avoid cross-origin errors in sandboxed environments.
    const swUrl = `${window.location.origin}/service-worker.js`;
    navigator.serviceWorker.register(swUrl).then(registration => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available. Dispatch a custom event to notify the app.
                window.dispatchEvent(
                  new CustomEvent('swUpdate', { detail: installingWorker })
                );
              }
            }
          };
        }
      };
    }).catch(error => {
      console.error('Error during service worker registration:', error);
    });

    // This listener will reload the page when the new service worker has taken control.
    let refreshing: boolean;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });
  }
});