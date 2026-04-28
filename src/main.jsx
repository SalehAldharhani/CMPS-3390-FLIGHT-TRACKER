import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './components/AuthContext.jsx';
import { FlightProvider } from './components/FlightContext.jsx';
import './styles/app.css';

// React Router wraps the whole app so any page can use <Link> / useNavigate.
// AuthProvider must wrap FlightProvider because tracked flights are scoped
// per-user — FlightProvider reads currentUser from AuthContext.

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
