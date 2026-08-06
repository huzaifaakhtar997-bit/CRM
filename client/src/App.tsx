import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Building2, Kanban } from "lucide-react";

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full border rounded-xl p-8 bg-card shadow-sm space-y-6 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full">
          <LayoutDashboard className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">HubSpot CRM MVP</h1>
          <p className="text-muted-foreground text-sm">
            Phase 1 Foundation Setup Complete. Client running with React, TypeScript, Tailwind CSS & Shadcn UI.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm py-4 border-y">
          <div className="flex flex-col items-center space-y-1">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-medium">Contacts</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-medium">Companies</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <Kanban className="w-5 h-5 text-primary" />
            <span className="font-medium">Deals Board</span>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Button variant="default">Frontend Active</Button>
          <Button variant="outline">Backend Ready</Button>
        </div>
      </div>
    </div>
  );
}

export default App;
