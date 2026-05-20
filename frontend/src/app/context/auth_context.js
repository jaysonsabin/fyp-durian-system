"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Check for a session when the app starts
  useEffect(() => {
    const token = localStorage.getItem("durian_token");
    const userId = localStorage.getItem("userId");

    if (token && userId) {
      setUser({ id: userId, token: token });
    }
    setLoading(false);
  }, []);

  // 2. Global Login Function
  const login = (token, userId) => {
    localStorage.setItem("durian_token", token);
    localStorage.setItem("userId", userId);
    setUser({ id: userId, token: token });
    router.push('/dashboard');
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