import axios from "axios";
import { toast } from "sonner";
import { ENV } from "@/conf";

const apiClient = axios.create({
  baseURL: ENV.VITE_BACKEND_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.data.message && response.data.message !== "success") {
      toast.success(response.data.message);
    }

    return response;
  },
  (error) => {

    if (error.response?.status === 401) {

      window.dispatchEvent(new Event("auth:unauthorized"));

      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }, 500);
    }

    return Promise.reject(error);
  }
);
export default apiClient;
