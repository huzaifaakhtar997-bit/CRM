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
      <div className="flex-1 flex flex-col lg:pl-60 min-h-screen min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <Header onMenuToggle={() => setSidebarOpen(true)} />

        {/* Content Section */}
        <main className="flex-1 p-4 sm:p-5 md:p-6 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="max-w-[1400px] w-full mx-auto space-y-5 min-w-0 animate-in fade-in duration-200">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
