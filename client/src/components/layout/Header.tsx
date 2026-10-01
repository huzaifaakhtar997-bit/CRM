import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLocation as useRouteLocation } from "react-router-dom";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { RefreshButton } from "../ui/RefreshButton";

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const location = useRouteLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path) return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
      case "MANAGER":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20";
      case "SALES_REP":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/70 bg-card/90 backdrop-blur-md px-5 shadow-2xs">
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-md border border-border/80 hover:bg-accent text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-muted-foreground">Workspace</span>
          <span className="text-muted-foreground/40 text-xs">/</span>
          <h2 className="text-xs font-semibold text-foreground tracking-tight">{getPageTitle()}</h2>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <RefreshButton variant="header" />
        <NotificationBell />

        <div className="relative ml-1">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 p-1 rounded-md hover:bg-accent/60 text-left transition-colors border border-transparent hover:border-border/60"
          >
            <div className="w-7 h-7 rounded-md bg-secondary text-foreground flex items-center justify-center font-bold text-xs border border-border/70">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left pr-1">
              <p className="text-xs font-semibold text-foreground leading-none">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">{user?.role?.toLowerCase()}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-56 origin-top-right rounded-lg border border-border/80 bg-popover text-popover-foreground shadow-elevation z-20 p-1">
                <div className="px-3 py-2 border-b border-border/60">
                  <p className="text-[11px] font-medium text-muted-foreground">Signed in as</p>
                  <p className="text-xs font-semibold truncate text-foreground mt-0.5">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                  <div className="mt-1.5">
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${getRoleBadgeColor(user?.role || "")}`}>
                      {user?.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="flex w-full items-center space-x-2 rounded-md px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors mt-0.5 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
