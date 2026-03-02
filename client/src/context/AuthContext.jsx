import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("lumeheaven_user") || localStorage.getItem("loomsheven_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = ({ token, user: userData }) => {
    localStorage.setItem("lumeheaven_token", token);
    localStorage.setItem("lumeheaven_user", JSON.stringify(userData));
    localStorage.removeItem("loomsheven_token");
    localStorage.removeItem("loomsheven_user");
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("lumeheaven_token");
    localStorage.removeItem("lumeheaven_user");
    localStorage.removeItem("loomsheven_token");
    localStorage.removeItem("loomsheven_user");
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
