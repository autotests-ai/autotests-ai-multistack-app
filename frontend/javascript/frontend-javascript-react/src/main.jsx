import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { APP_BASE } from './lib/appBase';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import './styles';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <BrowserRouter basename={APP_BASE}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

registerServiceWorker();
