// Stores displayName + stable clientId in localStorage — no registration needed.
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const UserContext = createContext(null);

function generateClientId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
}

export function UserProvider({ children }) {
  const [user, setUser]         = useState(null);   // { id, displayName }
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('cc_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { localStorage.removeItem('cc_user'); }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (displayName) => {
    let clientId = localStorage.getItem('cc_client_id');
    if (!clientId) {
      clientId = generateClientId();
      localStorage.setItem('cc_client_id', clientId);
    }
    const data    = await api.post('/users', { displayName, clientId });
    const newUser = { id: data.id, displayName: data.displayName };
    setUser(newUser);
    localStorage.setItem('cc_user', JSON.stringify(newUser));
    return newUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('cc_user');
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be inside UserProvider');
  return ctx;
}