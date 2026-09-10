import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <Header onMenuToggle={() => setSidebarOpen(true)} />

        {/* Content Section */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="max-w-7xl w-full mx-auto space-y-6 min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
