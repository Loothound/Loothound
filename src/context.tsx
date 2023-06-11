import React from "react";
import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

interface OauthContextType {
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const OauthContext = createContext("");
export function OauthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState("");
  useEffect(() => {
    setToken(localStorage.getItem("oauth_token") || "");
  }, []);
  useEffect(() => {
    const unlisten = listen("oauth_token", (evt) => {
      setToken(evt.payload as string);
      localStorage.setItem("oauth_token", evt.payload as string);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, [setToken]);

  return (
    <OauthContext.Provider value={token}>{children}</OauthContext.Provider>
  );
}

export default function useAuth() {
  return useContext(OauthContext);
}
