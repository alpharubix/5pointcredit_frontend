import axios from "axios";
import { toast } from "sonner";
import { ENV } from "@/conf";

declare module "axios" {
  interface AxiosRequestConfig {
    successMessage?: string;
    errorMessage?: string;
    skipErrorToast?: boolean;
  }
  interface InternalAxiosRequestConfig {
    successMessage?: string;
    errorMessage?: string;
    skipErrorToast?: boolean;
  }
}

const apiClient = axios.create({
  baseURL: ENV.VITE_BACKEND_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

console.log("Base URL:", ENV.VITE_BACKEND_BASE_URL);


// Helper to extract a user-friendly error message from backend responses
export const extractErrorMessage = (error: any): string | null => {
  let data = error.response?.data;
  if (!data) return null;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return data;
    }
  }

  const fromObject = (obj: any): string | null => {
    if (!obj || typeof obj !== "object") return null;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.msg === "string") return obj.msg;
    if (typeof obj.error === "string") return obj.error;
    return null;
  };

  const directMsg = fromObject(data);
  if (directMsg) return directMsg;

  const detail = data.detail;
  if (detail) {
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      for (const item of detail) {
        const itemMsg = fromObject(item);
        if (itemMsg) return itemMsg;
        if (typeof item === "string") return item;
      }
    }
    const detailMsg = fromObject(detail);
    if (detailMsg) return detailMsg;
  }

  const errors = data.errors;
  if (errors) {
    if (typeof errors === "string") return errors;
    if (Array.isArray(errors)) {
      for (const item of errors) {
        const itemMsg = fromObject(item);
        if (itemMsg) return itemMsg;
        if (typeof item === "string") return item;
      }
    }
    const errorsMsg = fromObject(errors);
    if (errorsMsg) return errorsMsg;
  }

  return null;
};

apiClient.interceptors.response.use(
  (response) => {
    const successMessage = response.config.successMessage;
    // console.log(successMessage)
    if (successMessage) {
      toast.success(successMessage);
    }

    return response;
  },
  (error) => {
    console.error("API error response:", error.response);

    if (error.config.url === "/user/me") {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      if (error.response?.status === 401 || error.response?.status === 403) {
        return Promise.reject(error);
      }
    }

    if (!error.config?.skipErrorToast) {
      const serverMessage = extractErrorMessage(error);
      console.log("Extracted server error message:", serverMessage);

      const errorMessage = serverMessage || error.config?.errorMessage;
      if (errorMessage) {
        toast.error(errorMessage);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;