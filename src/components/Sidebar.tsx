import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMe } from "@/hooks/useUser";
import { useLogout } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import FivePointCreditWhiteLogo from "../assets/5PontCreditWhiteLogo.svg";

// ─── Context ────────────────────────────────────────────────────────────────
interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}
const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

// ─── Nav Items ───────────────────────────────────────────────────────────────
const navItems = [
  { icon: ClipboardList, label: "Summary of Debit and Credit", path: "/summary-of-debit-and-credit" },
];


// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Sidebar Component ───────────────────────────────────────────────────────
export function AppSidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTheme, isDark } = useTheme();
  const logoutMutation = useLogout();

  // Fetch real user profile
  const { data: user, isLoading: userLoading } = useMe();

  const displayName = user?.customer_name || user?.email_id || "User";
  const displayEmail = user?.email_id || "";
  const displayCompany = user?.company_name || "";
  const initials = getInitials(displayName);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-[#000080] text-white transition-all duration-300 ease-in-out shadow-2xl shrink-0",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-[#000080] text-[#000080] shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Toggle sidebar"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-white/10",
          collapsed ? "justify-center" : ""
        )}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center">
          <img src={FivePointCreditWhiteLogo} alt="5PointCredit Logo" className="h-12 w-12" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <p className="text-base font-bold text-white tracking-wide">5PointCredit</p>
          </div>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-1">
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
            Main Menu
          </p>
        )}
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "sidebar-item w-full",
                active && "active",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-white/70")}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="border-t border-white/10 px-2 py-3 space-y-1">

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className={cn("sidebar-item w-full", collapsed && "justify-center px-0")}
          title={collapsed ? (isDark ? "Light Mode" : "Dark Mode") : undefined}
          id="theme-toggle"
        >
          {isDark ? (
            <Sun className="h-5 w-5 shrink-0 text-yellow-300" />
          ) : (
            <Moon className="h-5 w-5 shrink-0 text-white/70" />
          )}
          {!collapsed && (
            <span className="truncate">{isDark ? "Light Mode" : "Dark Mode"}</span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className={cn("sidebar-item w-full text-red-300 hover:text-red-200 hover:bg-red-900/30", collapsed && "justify-center px-0")}
          title={collapsed ? "Logout" : undefined}
          id="logout-btn"
        >
          {logoutMutation.isPending ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5 shrink-0" />
          )}
          {!collapsed && <span className="truncate">Logout</span>}
        </button>
      </div>

      {/* User Profile Card */}
      {!collapsed && (
        <div className="border-t border-white/10 p-4 animate-fade-in">
          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
            {userLoading ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Loader2 className="h-4 w-4 animate-spin text-white/60" />
              </div>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#000080] text-sm font-bold">
                {initials}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              {displayCompany ? (
                <p className="text-xs text-white/50 truncate">{displayCompany}</p>
              ) : (
                <p className="text-xs text-white/50 truncate">{displayEmail}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
