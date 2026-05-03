import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

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
          <img src="/favicon.svg" className="ft-header__mark" alt="" aria-hidden="true" />
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
