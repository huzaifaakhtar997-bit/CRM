import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Building2,
  PhoneCall,
  Kanban,
  CheckSquare,
  Mail,
  Megaphone,
  BarChart3,
  RefreshCw,
  Upload,
  Settings,
  X,
  Compass,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  roles?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const menuItems: MenuItem[] = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Contacts", path: "/contacts", icon: Users },
    { name: "Companies", path: "/companies", icon: Building2 },
    { name: "Leads", path: "/leads", icon: PhoneCall },
    { name: "Deals", path: "/deals", icon: Kanban },
    { name: "Tasks", path: "/tasks", icon: CheckSquare },
    { name: "Unified Inbox", path: "/inbox", icon: Mail },
    { name: "Campaigns", path: "/campaigns", icon: Megaphone },
    { name: "Reports", path: "/reports", icon: BarChart3 },
    { name: "Integrations", path: "/integrations", icon: RefreshCw },
    { name: "Imports", path: "/imports", icon: Upload },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  // Optional: Filter items based on user role if required in later phases
  const filteredItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r bg-card transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-primary text-primary-foreground rounded-lg">
              <Compass className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              CRM
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-accent hover:text-accent-foreground lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
