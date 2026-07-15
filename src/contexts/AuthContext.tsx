import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/hooks/useUser";

interface AuthUser {
  email_id?: string;
  customer_name?: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useMe();

  const setUser = useCallback((newUser: AuthUser) => {
    queryClient.setQueryData(["user", "me"], newUser);
  }, [queryClient]);

  const clearAuth = useCallback(() => {
    queryClient.clear();
    queryClient.setQueryData(["user", "me"], null);
    localStorage.removeItem("gst_reference_id");
  }, [queryClient]);

  // Listen for 401 events dispatched by the axios interceptor
  useEffect(() => {
    const handle = () => {
      clearAuth();
      navigate("/login");
    };
    window.addEventListener("auth:unauthorized", handle);
    return () => window.removeEventListener("auth:unauthorized", handle);
  }, [clearAuth, navigate]);

  useEffect(() => {
    if (isError) {
      clearAuth();
    }
  }, [isError, clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user: (user as AuthUser) || null,
        isAuthenticated: !!user,
        isLoading,
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
