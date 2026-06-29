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
    // console.log(successMessage)
    if (successMessage) {
      toast.success(successMessage);
    }

    return response;
  },
  (error) => {
    const errorMessage = error.config?.errorMessage;
    if (errorMessage) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default apiClient;