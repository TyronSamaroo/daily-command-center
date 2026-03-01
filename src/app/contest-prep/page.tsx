import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Card } from "@/components/ui/Card";
import { Dumbbell } from "lucide-react";

export default function ContestPrepPage() {
  return (
    <div>
      <ModuleHeader
        title="Contest Prep"
        subtitle="Weight tracking, macros & phase management"
      />
      <Card className="text-center py-12">
        <Dumbbell className="w-10 h-10 text-muted mx-auto mb-3" />
        <h2 className="text-lg font-medium mb-1">Coming Soon</h2>
        <p className="text-sm text-muted max-w-sm mx-auto">
          This module will include weight trends, macro adherence charts, phase-based projections, and bulk data import — ported from your existing OCB dashboard.
        </p>
      </Card>
    </div>
  );
}
