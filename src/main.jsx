import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { FlightProvider } from './components/FlightContext.jsx';
import './styles/app.css';

// React Router wraps the whole app so any page can use <Link> / useNavigate.
// FlightProvider gives every component access to tracked-flight state without
// prop drilling. (Owner: Jon - feel free to swap for Redux/Zustand later.)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <FlightProvider>
        <App />
      </FlightProvider>
    </BrowserRouter>
  </React.StrictMode>
);
