import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { validateUsername, validatePassword } from '../validators.js';

/**
 * Sign up page.
 * --------------------------------------------------------------------------
 * Validates username + password + confirm-password client-side, then calls
 * AuthContext.signUp. On success, the new user is automatically signed in
 * and sent to the home page.
 */
export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState(null);

  function onSubmit(e) {
    e.preventDefault();
    setError(null);

    const u = validateUsername(username);
    if (!u.ok) { setError(u.error); return; }

    const p = validatePassword(password);
    if (!p.ok) { setError(p.error); return; }

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    const result = signUp({ username: u.value, password: p.value });
    if (!result.ok) { setError(result.error); return; }

    navigate('/', { replace: true });
  }

  return (
    <div className="ft-auth">
      <div className="ft-auth__card">
        <p className="ft-auth__eyebrow mono">First time here?</p>
        <h1 className="ft-auth__title">Create your account</h1>
        <p className="ft-auth__lede">Pick a name, pick a password. Track flights. Done.</p>

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
            <small>3–20 characters. Letters, numbers, underscores, hyphens.</small>
          </label>

          <label className="ft-auth__field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>

          <label className="ft-auth__field">
            <span>Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type it again"
            />
          </label>

          {error && <p className="ft-auth__error" role="alert">{error}</p>}

          <button type="submit" className="ft-auth__btn">Create account</button>
        </form>

        <p className="ft-auth__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <p className="ft-auth__disclaimer">
          Demo accounts are stored locally in your browser. Don't reuse a real password.
        </p>
      </div>
    </div>
  );
}
