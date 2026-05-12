import axios from "axios";
import { toast } from "sonner";

const apiClient = axios.create({
  baseURL: "http://localhost:8080/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.data.message && response.data.message != "success") {
      toast.success(response.data.message);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event("auth:unauthorized"));
      // Fallback redirect in case the event listener is not active
      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }, 500);
    }

    let msg = "An error occurred during the request.";
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      msg = detail;
    } else if (detail && typeof detail === "object" && !Array.isArray(detail) && detail.message) {
      msg = detail.message;
    } else if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
      msg = detail[0].msg;
    } else if (error.response?.data?.message && typeof error.response.data.message === "string") {
      msg = error.response.data.message;
    } else if (error.message) {
      msg = error.message;
    }

    toast.error(msg);

    return Promise.reject(error);
  }
);

export default apiClient;
