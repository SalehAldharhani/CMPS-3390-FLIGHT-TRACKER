import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './components/HomePage.jsx';
import FlightDetailPage from './components/FlightDetailPage.jsx';
import SharedFlightPage from './components/SharedFlightPage.jsx';
import NotFoundPage from './components/NotFoundPage.jsx';

/**
 * Top-level route map.
 *
 * /                       -> Search + tracked flights list
 * /flight/:flightNumber   -> Detail (map, weather, status)
 * /share/:shareId         -> Public read-only view (deep-link feature)
 * *                       -> 404
 */
export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/flight/:flightNumber" element={<FlightDetailPage />} />
          <Route path="/share/:shareId" element={<SharedFlightPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
