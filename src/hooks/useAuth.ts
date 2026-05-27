import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  validateOtp,
  resetPassword,
  type RegisterPayload,
  type LoginPayload,
  type ForgotPasswordPayload,
  type ValidateOtpPayload,
  type ResetPasswordPayload,
} from "@/api/auth";
import { useAuthContext } from "@/contexts/AuthContext";
import { getMe } from "@/api/user";
import axios from "axios";

// Helper to extract a readable error message from Axios errors
function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong. Please try again."
    );
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

// ─── useRegister ─────────────────────────────────────────────────────────────
export function useRegister() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: RegisterPayload) => registerUser(data),
    onSuccess: () => {
      // Registration complete — send user to login to sign in
      navigate("/login");
    },
  });
}

// ─── useLogin ────────────────────────────────────────────────────────────────
export function useLogin() {
  const navigate = useNavigate();
  const { setUser } = useAuthContext();
  return useMutation({
    mutationFn: (data: LoginPayload) => loginUser(data),
    onSuccess: async (data) => {
      try {
        const userProfile = await getMe();
        setUser(userProfile);
      } catch (err) {
        const user = data?.user || data?.data?.user || data?.data || {};
        setUser(user);
      }
      navigate("/home/dashboard");
    },
  });
}

// ─── useLogout ───────────────────────────────────────────────────────────────
export function useLogout() {
  const navigate = useNavigate();
  const { clearAuth } = useAuthContext();
  return useMutation({
    mutationFn: () => logoutUser(),
    onSettled: () => {
      // Always clear local user cache regardless of API success/failure.
      // The server clears the HttpOnly cookie on its side.
      clearAuth();
      navigate("/login");
    },
  });
}

// ─── useForgotPassword ───────────────────────────────────────────────────────
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordPayload) => forgotPassword(data),
  });
}

// ─── useValidateOtp ──────────────────────────────────────────────────────────
export function useValidateOtp() {
  return useMutation({
    mutationFn: (data: ValidateOtpPayload) => validateOtp(data),
  });
}

// ─── useResetPassword ────────────────────────────────────────────────────────
export function useResetPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: ResetPasswordPayload) => resetPassword(data),
    onSuccess: () => {
      navigate("/login");
    },
  });
}

export { getApiError };
