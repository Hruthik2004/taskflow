import { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('tf_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/auth/me', token)
        .then(d => setUser(d.user))
        .catch(() => { localStorage.removeItem('tf_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('tf_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const signup = async (name, email, password, role) => {
    const data = await api.post('/auth/signup', { name, email, password, role });
    localStorage.setItem('tf_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('tf_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
