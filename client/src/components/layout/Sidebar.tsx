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
  Layers,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

interface NavSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const sections: NavSection[] = [
    {
      title: "OVERVIEW",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "RELATIONSHIPS",
      items: [
        { name: "Contacts", path: "/contacts", icon: Users },
        { name: "Companies", path: "/companies", icon: Building2 },
        { name: "Leads", path: "/leads", icon: PhoneCall },
      ],
    },
    {
      title: "PIPELINE",
      items: [
        { name: "Deals", path: "/deals", icon: Kanban },
        { name: "Unified Inbox", path: "/inbox", icon: Mail },
        { name: "Tasks", path: "/tasks", icon: CheckSquare },
      ],
    },
    {
      title: "INTELLIGENCE",
      items: [
        { name: "Campaigns", path: "/campaigns", icon: Megaphone },
        { name: "Reports", path: "/reports", icon: BarChart3 },
      ],
    },
    {
      title: "WORKSPACE",
      items: [
        { name: "Integrations", path: "/integrations", icon: RefreshCw },
        { name: "Imports", path: "/imports", icon: Upload },
        { name: "Settings", path: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-60 border-r border-border/80 bg-card transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-5 border-b border-border/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center shadow-2xs">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold tracking-tight text-foreground font-display">
                  PULSE
                </span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-muted text-muted-foreground border border-border/60">
                  CRM
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 space-y-4 px-3 py-3 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
          {sections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.roles || (user && item.roles.includes(user.role))
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                  {section.title}
                </div>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center space-x-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? "bg-secondary text-foreground font-semibold shadow-2xs border border-border/60"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0 transition-colors" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
