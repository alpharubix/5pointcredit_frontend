import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";

interface AuthUser {
  email_id?: string;
  customer_name?: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Store only lightweight user info (display name etc.) — NOT a token.
  // The real session lives in the HttpOnly cookie managed by the browser.
  const [user, setUserState] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("auth_user");
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();

  const setUser = useCallback((newUser: AuthUser) => {
    localStorage.setItem("auth_user", JSON.stringify(newUser));
    setUserState(newUser);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("auth_user");
    setUserState(null);
  }, []);

  // Listen for 401 events dispatched by the axios interceptor
  useEffect(() => {
    const handle = () => {
      clearAuth();
      navigate("/login");
    };
    window.addEventListener("auth:unauthorized", handle);
    return () => window.removeEventListener("auth:unauthorized", handle);
  }, [clearAuth, navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        setUser,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within <AuthProvider>");
  return ctx;
}
