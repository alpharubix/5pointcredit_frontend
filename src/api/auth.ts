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
  const response = await apiClient.post("/auth/register", data);
  return response.data;
};

export const loginUser = async (data: LoginPayload) => {
  const response = await apiClient.post("/auth/login", data);
  return response.data;
};

export const logoutUser = async () => {
  const response = await apiClient.post("/auth/logout");
  return response.data;
};

export const forgotPassword = async (data: ForgotPasswordPayload) => {
  const response = await apiClient.post("/auth/forgot_password", data);
  return response.data;
};

export const validateOtp = async (data: ValidateOtpPayload) => {
  const response = await apiClient.post("/auth/validate-otp", data);
  return response.data;
};

export const resetPassword = async (data: ResetPasswordPayload) => {
  const response = await apiClient.post("/auth/reset_password", data);
  return response.data;
};
