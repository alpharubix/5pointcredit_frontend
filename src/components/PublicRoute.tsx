import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

export default function PublicRoute() {
  const { isAuthenticated } = useAuthContext();

  if (isAuthenticated) {
    return <Navigate to="/home/dashboard" replace />;
  }

  return <Outlet />;
}
