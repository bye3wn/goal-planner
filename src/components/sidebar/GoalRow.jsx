import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { COLORS } from "../../constants/theme";
import MilestoneList from "./MilestoneList";

export default function GoalRow({ goal, isOpen, onToggle, onToggleMilestone, onAddMilestone }) {
  const doneCount = goal.milestones.filter((m) => m.done).length;
  const total = goal.milestones.length;

  return (
    <div className="mb-2">
      <button onClick={() => onToggle(goal.id)} className="w-full flex items-center gap-2 py-1.5 text-left">
        {isOpen ? <ChevronDown size={14} color={COLORS.inkFaint} /> : <ChevronRight size={14} color={COLORS.inkFaint} />}
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: goal.color }} />
        <span className="text-sm font-medium flex-1 truncate">{goal.title}</span>
        <span className="font-mono text-[11px]" style={{ color: COLORS.inkFaint }}>
          {doneCount}/{total}
        </span>
      </button>

      {isOpen && (
        <MilestoneList goal={goal} onToggleMilestone={onToggleMilestone} onAddMilestone={onAddMilestone} />
      )}
    </div>
  );
}
