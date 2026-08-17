import React from "react";

export const Reports: React.FC = () => {
  return (
    <div className="bg-card border rounded-xl p-8 shadow-sm text-center max-w-xl mx-auto my-12 space-y-4">
      <h2 className="text-xl font-bold text-foreground">Reports</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        The Reports and analytics module will be implemented in a subsequent phase.
      </p>
      <div className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-muted-foreground">
        Coming Soon
      </div>
    </div>
  );
};

export default Reports;
