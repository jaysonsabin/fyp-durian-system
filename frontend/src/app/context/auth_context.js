"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Decode JWT payload helper
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  // 1. Check for a session when the app starts
  useEffect(() => {
    const token = localStorage.getItem("durian_token");
    const userId = localStorage.getItem("userId");

    if (token && userId) {
      const decoded = decodeToken(token);
      setUser({ 
        id: userId, 
        token: token, 
        role: decoded?.role, 
        type: decoded?.type, 
        username: decoded?.sub 
      });
    }
    setLoading(false);
  }, []);

  // 2. Global Login Function
  const login = (token, userId) => {
    localStorage.setItem("durian_token", token);
    localStorage.setItem("userId", userId);
    const decoded = decodeToken(token);
    setUser({ 
      id: userId, 
      token: token, 
      role: decoded?.role, 
      type: decoded?.type, 
      username: decoded?.sub 
    });
    
    if (decoded?.role === "Pentadbir") {
      router.push('/activity-log'); // We stay in /activity-log shell but page.js forces 'forum' module!
    } else {
      router.push('/activity-log');
    }
  };

  // 3. Global Logout Function
  const logout = () => {
    localStorage.removeItem("durian_token");
    localStorage.removeItem("userId");
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily use this context anywhere
export const useAuth = () => useContext(AuthContext);