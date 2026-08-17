import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLocation as useRouteLocation } from "react-router-dom";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { NotificationBell } from "./NotificationBell";

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
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "MANAGER":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "SALES_REP":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default:
        return "bg-muted text-muted-foreground border-muted-foreground/20";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card/85 backdrop-blur-md px-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg border hover:bg-accent hover:text-accent-foreground lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{getPageTitle()}</h2>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-accent text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-foreground leading-none">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">{user?.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border bg-popover text-popover-foreground shadow-lg z-20 p-1">
                <div className="px-3 py-2 border-b">
                  <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-semibold truncate text-foreground mt-0.5">{user?.name}</p>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold mt-1.5 ${getRoleBadgeColor(user?.role || "")}`}>
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
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
