import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './components/AuthContext.jsx';
import { FlightProvider } from './components/FlightContext.jsx';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FlightProvider>
          <App />
        </FlightProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
