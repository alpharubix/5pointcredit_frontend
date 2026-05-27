import apiClient from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  customer_name: string;
  company_name: string;
  phone_no: string;
  email_id: string;
  password: string;
}

export interface LoginPayload {
  email_id: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email_id: string;
}

export interface ValidateOtpPayload {
  email_id: string;
  otp: string;
}

export interface ResetPasswordPayload {
  reset_token: string;
  new_password: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const registerUser = async (data: RegisterPayload) => {
  const response = await apiClient.post("/auth/register", data, {
    successMessage: "Account created successfully! Please log in.",
    errorMessage: "Registration failed. Please try again.",
  });
  return response.data;
};

export const loginUser = async (data: LoginPayload) => {
  const response = await apiClient.post("/auth/login", data, {
    successMessage: "Login successfull!",
    errorMessage: "Invalid email or password. Please try again.",
  });
  return response.data;
};

export const logoutUser = async () => {
  const response = await apiClient.post("/auth/logout", undefined, {
    successMessage: "You've been logged out successfully.",
    errorMessage: "Logout failed. Please try again.",
  });
  return response.data;
};

export const forgotPassword = async (data: ForgotPasswordPayload) => {
  const response = await apiClient.post("/auth/forgot_password", data, {
    successMessage: "OTP sent to your email address.",
    errorMessage: "Could not send OTP. Please try again.",
  });
  return response.data;
};

export const validateOtp = async (data: ValidateOtpPayload) => {
  const response = await apiClient.post("/auth/validate-otp", data, {
    successMessage: "OTP verified successfully.",
    errorMessage: "Invalid or expired OTP. Please try again.",
  });
  return response.data;
};

export const resetPassword = async (data: ResetPasswordPayload) => {
  const response = await apiClient.post("/auth/reset_password", data, {
    successMessage: "Password reset successfully. Please log in.",
    errorMessage: "Failed to reset password. Your link may have expired.",
  });
  return response.data;
};