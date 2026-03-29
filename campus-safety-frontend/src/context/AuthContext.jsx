// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
  const token = localStorage.getItem("token");

  if (token) {
    try {
      const decoded = jwtDecode(token);

      const userData = {
        id: decoded.id,        // ✅ ADD THIS (MISSING)
        email: decoded.sub,
        role: decoded.role,
        token: token
      };

      console.log("Decoded JWT:", decoded); // 🔍 DEBUG

      localStorage.setItem("email", decoded.sub);
      setUser(userData);

    } catch (error) {
      localStorage.removeItem("token");
    }
  }
}, []);

  const login = (token) => {
    const decoded = jwtDecode(token);
    const userData = {
  id: decoded.id,        // ✅ NOW THIS WILL EXIST
  email: decoded.sub,
  role: decoded.role,
  token: token
};
    localStorage.setItem("token", token);
    localStorage.setItem("email", decoded.sub);
    setUser(userData);
  };

  const logout = () => {
    const email = localStorage.getItem("email");
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    if (email) localStorage.removeItem(`notifications_${email}`);
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}