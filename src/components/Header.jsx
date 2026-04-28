import { Link } from 'react-router-dom';

/**
 * App header / nav bar.
 * OWNER: Jon (structure) + JASD3EP (visual treatment in Header.css)
 */
export default function Header() {
  return (
    <header className="ft-header">
      <div className="ft-header__inner">
        <Link to="/" className="ft-header__brand" aria-label="Flight Tracker home">
          <span className="ft-header__mark" aria-hidden="true">✈</span>
          <span className="ft-header__name">Flight Tracker</span>
        </Link>

        <nav className="ft-header__nav">
          <Link to="/" className="ft-header__link">Track</Link>
          {/* TODO: DESIGN - decide if we want About / Settings nav items */}
        </nav>
      </div>
    </header>
  );
}
