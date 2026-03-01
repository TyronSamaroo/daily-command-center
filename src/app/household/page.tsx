import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Card } from "@/components/ui/Card";
import { Home } from "lucide-react";

export default function HouseholdPage() {
  return (
    <div>
      <ModuleHeader
        title="Household"
        subtitle="Partner schedules, chores & coordination"
      />
      <Card className="text-center py-12">
        <Home className="w-10 h-10 text-muted mx-auto mb-3" />
        <h2 className="text-lg font-medium mb-1">Coming Soon</h2>
        <p className="text-sm text-muted max-w-sm mx-auto">
          This module will include the calendar month view, partner schedule coordination, task management with smart suggestions, and laundry tracking — ported from your chore scheduler.
        </p>
      </Card>
    </div>
  );
}
