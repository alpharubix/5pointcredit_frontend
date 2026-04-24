import { Navigate, Outlet } from "react-router-dom";
import { useMe } from "@/hooks/useUser";


export default function ProtectedRoute() {
  const { isLoading, isError } = useMe();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <span className="h-10 w-10 rounded-full border-4 border-[#000080]/20 border-t-[#000080] animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">....</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
