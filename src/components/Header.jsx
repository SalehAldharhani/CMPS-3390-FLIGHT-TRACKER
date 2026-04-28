import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

/**
 * App header / nav bar.
 * Shows the current username + sign-out when signed in, or sign-in/up links
 * when not. The brand mark always links to the appropriate landing page.
 *
 * OWNER: Jon (structure) + JASD3EP (visual treatment via .ft-header* classes)
 */
export default function Header() {
  const { isSignedIn, currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className="ft-header">
      <div className="ft-header__inner">
        <Link
          to={isSignedIn ? '/' : '/login'}
          className="ft-header__brand"
          aria-label="Flight Tracker home"
        >
          <span className="ft-header__mark" aria-hidden="true">✈</span>
          <span className="ft-header__name">Flight Tracker</span>
        </Link>

        <nav className="ft-header__nav">
          {isSignedIn ? (
            <>
              <span className="ft-header__user mono">@{currentUser}</span>
              <button
                type="button"
                className="ft-header__link ft-header__signout"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login"  className="ft-header__link">Sign in</Link>
              <Link to="/signup" className="ft-header__link ft-header__link--primary">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
