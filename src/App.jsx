import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './components/HomePage.jsx';
import FlightDetailPage from './components/FlightDetailPage.jsx';
import SharedFlightPage from './components/SharedFlightPage.jsx';
import NotFoundPage from './components/NotFoundPage.jsx';
import LoginPage from './components/LoginPage.jsx';
import SignupPage from './components/SignupPage.jsx';
import RequireAuth from './components/RequireAuth.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route path="/share/:shareId" element={<SharedFlightPage />} />

          <Route path="/" element={
            <RequireAuth><HomePage /></RequireAuth>
          } />
          <Route path="/flight/:flightNumber" element={
            <RequireAuth><FlightDetailPage /></RequireAuth>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
