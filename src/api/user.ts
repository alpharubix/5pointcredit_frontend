import apiClient from "@/lib/axios";

export interface UserProfile {
  user_id?: string;
  customer_name?: string;
  company_name?: string;
  email_id?: string;
  phone_no?: string;
  role?: string;
  [key: string]: unknown;
}

export const getMe = async (): Promise<UserProfile> => {
  const response = await apiClient.get("/user/me");
  return response.data?.data ?? response.data;
};
