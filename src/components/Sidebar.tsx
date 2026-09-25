import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  LayoutDashboard,
  Building2,
  FileText,
  PieChart,
  CreditCard,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMe } from "@/hooks/useUser";
import { useLogout } from "@/hooks/useAuth";
import FivePointCreditWhiteLogo from "../assets/5PontCreditWhiteLogo.svg";
import { downloadItrReport } from "@/api/export";
import { toast } from "sonner";


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

interface NavSubItem {
  label: string;
  path: string;
  disabled?: boolean;
}

interface NavItem {
  icon: any;
  label: string;
  path?: string;
  service?: string;
  disabled?: boolean;
  subItems?: NavSubItem[];
}

// ─── Nav Items ───────────────────────────────────────────────────────────────
const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/home/dashboard" },
  {
    icon: Building2,
    label: 'BSA Reports',
    subItems: [{ label: 'Bank Accounts', path: '/bsa/bank-accounts', disabled: false }],
  },
  {
    icon: FileText,
    label: "GST",
    service: "GST",
    subItems: [
      { label: "GST Analysis", path: "/gst/analysis" },
      { label: "GST Analysis History", path: "/gst/history" },
      { label: "GST Reports", path: "/gst/reports" }
    ]
  },
  {
    icon: PieChart,
    label: "ITR",
    service: "ITR",
    subItems: [
      { label: "Export", path: "/itr/export" },
      { label: "Tax Calculation", path: "/itr/itr-tax-calculation" },
      { label: "Balance Sheet", path: "/itr/balance-sheet" },
      { label: "Profit and Loss Statement", path: "/itr/profit-and-loss-statement" },
      { label: "Ratio Analysis", path: "/itr/ratio-analysis" },
    ]
  },
  {
    icon: CreditCard,
    label: "CIBIL",
    service: "CIBIL",
    subItems: [
      { label: "Credit Score", path: "/cibil" },
      { label: "Previous Reports", path: "/cibil/reports" }
    ]
  },
  {
    icon: CreditCard,
    label: "Payments",
    path: "/payments"
  }
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
  const logoutMutation = useLogout();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Fetch real user profile
  const { data: user, isLoading: userLoading } = useMe();

  const displayName = user?.customer_name || user?.email_id || "User";
  const displayEmail = user?.email_id || "";
  const displayCompany = user?.company_name || "";
  const initials = getInitials(displayName);
  const [isExportingItr, setIsExportingItr] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleSubItemClick = async (sub: NavSubItem) => {
    if (sub.disabled) return;

    if (sub.path === '/itr/export') {
      if (isExportingItr) return;
      try {
        setIsExportingItr(true);
        toast.loading(
          'Downloading ITR Report (Tax Calculation, Balance Sheet, Profit & Loss, Ratio Analysis)...',
          { id: 'itr-sidebar-export' }
        );
        await downloadItrReport();
        toast.success('ITR Report downloaded successfully!', {
          id: 'itr-sidebar-export',
        });
      } catch (error: any) {
        toast.error(error?.message || 'Failed to download ITR report', {
          id: 'itr-sidebar-export',
        });
      } finally {
        setIsExportingItr(false);
      }
      return;
    }

    navigate(sub.path);
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
          const hasSubItems = !!item.subItems;

          const isExpanded = expandedMenus[item.label];

          const isActive = item.path
            ? location.pathname === item.path
            : item.subItems?.some(sub => location.pathname === sub.path);

          return (
            <div key={item.label}>
              <button
                onClick={() => {
                  if (hasSubItems) {
                    if (collapsed) {
                      setCollapsed(false);
                      setExpandedMenus((prev) => ({ ...prev, [item.label]: true }));
                    } else {
                      toggleMenu(item.label);
                    }
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                className={cn(
                  "sidebar-item w-full",
                  isActive && !hasSubItems && "active",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon
                  className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-white/70")}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && hasSubItems && (
                  <div className="ml-auto">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                )}
                {!collapsed && isActive && !hasSubItems && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </button>

              {/* SubItems */}
              {!collapsed && hasSubItems && isExpanded && (
                <div className="mt-1 flex flex-col space-y-1 pl-9 pr-2 overflow-hidden animate-accordion-down">
                  {item.subItems!.map((sub) => {
                    const isSubActive = location.pathname === sub.path;
                    return (
                      <button
                        key={sub.path}
                        onClick={() => handleSubItemClick(sub)}
                        disabled={sub.disabled || (sub.path === '/itr/export' && isExportingItr)}
                        className={cn(
                          "flex items-center w-full px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer",
                          isSubActive && "text-white font-medium bg-white/20",
                          sub.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-white/70"
                        )}
                      >
                        <span className="truncate">{sub.label}</span>
                        {sub.path === '/itr/export' && isExportingItr ? (
                          <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-white" />
                        ) : (
                          isSubActive && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="border-t border-white/10 px-2 py-3 space-y-1">

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
        <div className="border-t border-white/10 p-4 animate-fade-in cursor-pointer" onClick={() => navigate("/profile")}>
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
            <div className="overflow-hidden" >
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
