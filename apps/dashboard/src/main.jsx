import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

async function prepareApp() {
  const enableMocks = import.meta.env.VITE_ENABLE_MOCKS === 'true';

  if (enableMocks) {
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      });
      console.log('🌾 [Kisan Setu] MSW mock worker started successfully');
    } catch (err) {
      console.warn('MSW worker could not start:', err);
    }
  }
}

prepareApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
