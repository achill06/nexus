import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import {
  api,
  ApiError,
  getToken,
  setToken as persistToken,
  clearToken,
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [email, setEmail] = useState(null);

  // While we check an existing token against GET /me on first load, treat
  // the user as "unknown" rather than "logged out" so the router doesn't
  // flash the login page before we've confirmed the token is dead.
  const [checkingSession, setCheckingSession] = useState(
    () => !!getToken()
  );

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUserId(null);
    setUsername(null);
    setEmail(null);
  }, []);

  // Resolve the signed-in user's profile for a token we already have.
  const loadSession = useCallback(async () => {
    try {
      const me = await api.get('/me');

      setUserId(me.userId);
      setUsername(me.username);
      setEmail(me.email);
    } catch {
      // token was invalid/expired — client.js already cleared it and fired
      // nexus:unauthorized, which the effect below turns into logout()
    } finally {
      setCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadSession();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onUnauthorized = () => logout();

    window.addEventListener(
      'nexus:unauthorized',
      onUnauthorized
    );

    return () => {
      window.removeEventListener(
        'nexus:unauthorized',
        onUnauthorized
      );
    };
  }, [logout]);

  async function login(email, password) {
    const { token: newToken } = await api.post(
      '/auth/login',
      {
        email,
        password,
      }
    );

    persistToken(newToken);
    setTokenState(newToken);

    await loadSession();
  }

  async function signup(username, email, password) {
    const { token: newToken } = await api.post(
      '/auth/signup',
      {
        username,
        email,
        password,
      }
    );

    persistToken(newToken);
    setTokenState(newToken);

    await loadSession();
  }

  const value = {
    token,
    userId,
    username,
    email,
    checkingSession,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}

export { ApiError };