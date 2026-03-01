import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Card } from "@/components/ui/Card";
import { BarChart3 } from "lucide-react";

export default function WeeklyRetroPage() {
  return (
    <div>
      <ModuleHeader
        title="Weekly Retro"
        subtitle="Review your week's progress and patterns"
      />
      <Card className="text-center py-12">
        <BarChart3 className="w-10 h-10 text-muted mx-auto mb-3" />
        <h2 className="text-lg font-medium mb-1">Coming Soon</h2>
        <p className="text-sm text-muted max-w-sm mx-auto">
          This module will auto-generate weekly summaries across all modules — work blocks completed, macro compliance, household tasks done, and pattern insights.
        </p>
      </Card>
    </div>
  );
}
