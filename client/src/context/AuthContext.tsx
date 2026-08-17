import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types/auth.types";
import { api } from "../api/axios";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("crm_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        if (response.data?.success && response.data?.data?.user) {
          setUser(response.data.data.user);
        } else {
          localStorage.removeItem("crm_token");
        }
      } catch (err: any) {
        console.error("Failed to restore session:", err);
        localStorage.removeItem("crm_token");
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data?.success && response.data?.data) {
        const { user: loggedInUser, token } = response.data.data;
        localStorage.setItem("crm_token", token);
        setUser(loggedInUser);
      } else {
        throw new Error(response.data?.message || "Invalid response format");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Login failed";
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("crm_token");
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
