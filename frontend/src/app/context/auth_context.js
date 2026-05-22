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
    const checkSession = async () => {
      try {
        const response = await fetch("http://localhost:8001/auth/me", {
          credentials: "include"
        });
        if (response.ok) {
          const data = await response.json();
          setUser({ 
            id: data.id, 
            role: data.role, 
            username: data.username 
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Session check failed:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // 2. Global Login Function
  const login = (userData) => {
    setUser({ 
      id: userData.id, 
      role: userData.role, 
      username: userData.username 
    });
    
    if (userData.role === "Pentadbir") {
      router.push('/activity-log');
    } else {
      router.push('/activity-log');
    }
  };

  // 3. Global Logout Function
  const logout = async () => {
    try {
      await fetch("http://localhost:8001/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (e) {
      console.error("Logout request failed:", e);
    }
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