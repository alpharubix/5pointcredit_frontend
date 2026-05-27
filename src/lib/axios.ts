import axios from "axios";
import { toast } from "sonner";
import { ENV } from "@/conf";

declare module "axios" {
  interface AxiosRequestConfig {
    successMessage?: string;
    errorMessage?: string;
  }
  interface InternalAxiosRequestConfig {
    successMessage?: string;
    errorMessage?: string;
  }
}

const apiClient = axios.create({
  baseURL: ENV.VITE_BACKEND_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => {
    const successMessage = response.config.successMessage;
    console.log(successMessage)
    if (successMessage) {
      toast.success(successMessage);
    }

    return response;
  },
  (error) => {
    const responseCode = error.response?.data?.detail?.responseCode;
    const isGstAuthError = responseCode === "EOA048" || responseCode === "EAE052";

    if (error.response?.status === 401 && !isGstAuthError) {
      window.dispatchEvent(new Event("auth:unauthorized"));

      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }, 500);
    }

    const errorMessage = error.config?.errorMessage;
    if (errorMessage) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default apiClient;