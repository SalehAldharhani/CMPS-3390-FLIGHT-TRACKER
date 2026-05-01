import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { validateUsername, validatePassword } from '../validators.js';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const redirectTo = location.state?.from?.pathname ?? '/';

  function onSubmit(e) {
    e.preventDefault();
    setError(null);

    const u = validateUsername(username);
    if (!u.ok) { setError(u.error); return; }

    const p = validatePassword(password);
    if (!p.ok) { setError(p.error); return; }

    const result = signIn({ username: u.value, password: p.value });
    if (!result.ok) { setError(result.error); return; }

    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="ft-auth">
      <div className="ft-auth__card">
        <p className="ft-auth__eyebrow mono">Welcome back</p>
        <h1 className="ft-auth__title">Sign in</h1>
        <p className="ft-auth__lede">Pick up where you left off — your tracked flights are waiting.</p>

        <form className="ft-auth__form" onSubmit={onSubmit} noValidate>
          <label className="ft-auth__field">
            <span>Username</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="jon"
              autoFocus
            />
          </label>

          <label className="ft-auth__field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && <p className="ft-auth__error" role="alert">{error}</p>}

          <button type="submit" className="ft-auth__btn">Sign in</button>
        </form>

        <p className="ft-auth__switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>

        <p className="ft-auth__disclaimer">
          Demo accounts are stored locally in your browser. Don't reuse a real password.
        </p>
      </div>
    </div>
  );
}
