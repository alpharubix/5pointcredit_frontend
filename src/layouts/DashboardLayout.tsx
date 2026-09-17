import { AppSidebar, SidebarProvider } from "@/components/Sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function DashboardLayout() {
  const location = useLocation();
  const isDashboard = location.pathname === "/home/dashboard";

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <AppSidebar />
        <main
          className={cn(
            "flex-1 bg-background",
            isDashboard ? "h-screen overflow-hidden" : "overflow-y-auto"
          )}
        >
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
