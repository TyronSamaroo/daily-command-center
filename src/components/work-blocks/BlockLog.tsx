"use client";

import { Clock, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatTime, formatDuration } from "@/lib/utils/dates";
import type { WorkBlock } from "@/types";

interface BlockLogProps {
  blocks: WorkBlock[];
  onDelete: (id: number) => void;
  readOnly?: boolean;
}

export function BlockLog({ blocks, onDelete, readOnly }: BlockLogProps) {
  const completedBlocks = blocks.filter((b) => b.endTime);

  if (completedBlocks.length === 0) {
    return (
      <Card className="text-center py-8">
        <Clock className="w-8 h-8 text-muted mx-auto mb-2" />
        <p className="text-sm text-muted">No blocks completed today</p>
        <p className="text-xs text-muted mt-1">Start a 45-minute focus sprint above</p>
      </Card>
    );
  }

  return (
    <Card className="p-0 divide-y divide-border">
      <div className="px-5 py-3">
        <h3 className="text-sm font-medium text-muted">Today&apos;s Blocks</h3>
      </div>
      {completedBlocks.map((block) => (
        <div key={block.id} className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <div>
              <div className="text-sm">
                {formatTime(block.startTime)}
                {block.endTime && ` - ${formatTime(block.endTime)}`}
              </div>
              {block.label && (
                <div className="text-xs text-muted">{block.label}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-accent font-medium">
              {block.durationMin ? formatDuration(block.durationMin) : "—"}
            </span>
            {!readOnly && (
              <button
                onClick={() => onDelete(block.id)}
                className="text-muted hover:text-danger transition-colors p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </Card>
  );
}
