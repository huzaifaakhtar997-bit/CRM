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
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage users, roles, and reusable templates.</p>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center border-b">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
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
