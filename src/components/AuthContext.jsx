import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const USERS_KEY   = 'ft.users.v1';
const CURRENT_KEY = 'ft.currentUser.v1';
const AuthContext = createContext(null);

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveUsers(users) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
  catch { /* quota / private mode - ignore */ }
}

function loadCurrent() {
  try { return localStorage.getItem(CURRENT_KEY) || null; }
  catch { return null; }
}

function saveCurrent(username) {
  try {
    if (username) localStorage.setItem(CURRENT_KEY, username);
    else          localStorage.removeItem(CURRENT_KEY);
  } catch { /* ignore */ }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(loadCurrent);

  useEffect(() => { saveCurrent(currentUser); }, [currentUser]);

  const signUp = useCallback(({ username, password }) => {
    const users = loadUsers();
    if (users[username]) {
      return { ok: false, error: 'That username is already taken.' };
    }
    users[username] = { password };
    saveUsers(users);
    setCurrentUser(username);
    return { ok: true };
  }, []);

  const signIn = useCallback(({ username, password }) => {
    const users = loadUsers();
    const user = users[username];
    if (!user)               return { ok: false, error: 'No account with that username.' };
    if (user.password !== password) return { ok: false, error: 'Wrong password.' };
    setCurrentUser(username);
    return { ok: true };
  }, []);

  const signOut = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const isSignedIn = !!currentUser;

  const value = { currentUser, isSignedIn, signUp, signIn, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
