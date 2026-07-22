import React from "react";
import { Circle, CheckCircle2, Plus } from "lucide-react";
import { COLORS } from "../../constants/theme";

// Milestone rows are clickable — clicking one opens MilestoneModal for
// editing/deleting it. They're never checked off directly; the check
// icon just reflects milestoneStats, computed from their subtasks.
export default function MilestoneList({ goal, milestoneStats, onMilestoneClick, onAddMilestone }) {
  const doneCount = goal.milestones.filter((m) => milestoneStats[m.id]?.done).length;
  const total = goal.milestones.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="ml-[19px] pl-4 flex flex-col gap-1.5 py-1" style={{ borderLeft: `2px dashed ${COLORS.line}` }}>
      <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: COLORS.line }}>
        <div className="h-full" style={{ width: `${pct}%`, background: goal.color }} />
      </div>

      {goal.milestones.map((m) => {
        const stats = milestoneStats[m.id] || { done: false, label: "" };
        return (
          <button
            key={m.id}
            onClick={() => onMilestoneClick(m)}
            className="flex items-center gap-2 py-1 text-left rounded-md px-1 -mx-1 hover:bg-black/5 transition-colors"
          >
            {stats.done ? (
              <CheckCircle2 size={14} color={goal.color} className="flex-shrink-0" />
            ) : (
              <Circle size={14} color={COLORS.inkFaint} className="flex-shrink-0" />
            )}
            <span
              className="text-[13px] flex-1 truncate"
              style={{ color: stats.done ? COLORS.inkFaint : COLORS.ink, textDecoration: stats.done ? "line-through" : "none" }}
            >
              {m.title}
            </span>
            <span className="font-mono text-[10px] flex-shrink-0" style={{ color: COLORS.inkFaint }}>
              {stats.label}
            </span>
          </button>
        );
      })}

      <button
        onClick={() => onAddMilestone(goal.id)}
        className="flex items-center gap-1.5 text-[12px] mt-1 py-0.5"
        style={{ color: COLORS.inkFaint }}
      >
        <Plus size={12} /> Add waypoint
      </button>
    </div>
  );
}
