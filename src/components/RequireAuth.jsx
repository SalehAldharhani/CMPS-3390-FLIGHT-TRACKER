import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

/**
 * RequireAuth
 * --------------------------------------------------------------------------
 * Wraps a page component. If no user is signed in, redirects to /login
 * and remembers where we were trying to go (so post-login can return there).
 *
 * Usage in App.jsx:
 *   <Route path="/foo" element={<RequireAuth><FooPage /></RequireAuth>} />
 */
export default function RequireAuth({ children }) {
  const { isSignedIn } = useAuth();
  const location = useLocation();

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
