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
    }
    const msg = error.response?.data?.message || error.response?.data?.error;
    if (msg) {
      toast.error(msg);
    } else {
      toast.error("An error occurred during the request.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
