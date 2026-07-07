import apiClient from "@/lib/axios";

export interface UserProfile {
  user_id?: string;
  customer_name?: string;
  company_name?: string;
  email_id?: string;
  phone?: string;
  gst_number?: string | null;
  [key: string]: unknown;

}

export const getMe = async (): Promise<UserProfile> => {
  const response = await apiClient.get("/user/me");
  return response.data?.data ?? response.data;
  
};

export const updateProfile = async (data: Partial<UserProfile>) => {
  console.log("Updating profile with data:", data);
  const response = await apiClient.put("/user/me", data);
  return response.data?.data ?? response.data;
};

