import { listen } from '@tauri-apps/api/event';
import React, { createContext, useContext, useEffect, useState } from 'react';

const OAuthContext = createContext('');

export function OAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState('');

  useEffect(() => {
    setToken(localStorage.getItem('oauth_token') || '');
  }, []);

  useEffect(() => {
    const unlisten = listen('oauth_token', (evt) => {
      setToken(evt.payload as string);
      localStorage.setItem('oauth_token', evt.payload as string);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, [setToken]);

  return (
    <OAuthContext.Provider value={token}>{children}</OAuthContext.Provider>
  );
}

export default function useAuth() {
  return useContext(OAuthContext);
}
