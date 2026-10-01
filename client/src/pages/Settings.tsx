import React, { useState } from "react";
import { UsersSettings } from "../components/settings/UsersSettings";
import { TemplatesSettings } from "../components/settings/TemplatesSettings";
import { Users, FileText } from "lucide-react";

type Tab = "users" | "templates";

const tabs = [
  { id: "users" as Tab, label: "User Management", icon: Users },
  { id: "templates" as Tab, label: "Reply Templates", icon: FileText },
];

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("users");

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage team access permissions, sales roles, and reusable email templates.</p>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-md border border-border/60 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === id
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-2">
        {activeTab === "users" && <UsersSettings />}
        {activeTab === "templates" && <TemplatesSettings />}
      </div>
    </div>
  );
};

export default Settings;
