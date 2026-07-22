import React from "react";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { COLORS } from "../../constants/theme";
import MilestoneList from "./MilestoneList";

export default function GoalRow({ goal, isOpen, milestoneStats, onToggle, onEditGoal, onAddMilestone, onMilestoneClick }) {
  const doneCount = goal.milestones.filter((m) => milestoneStats[m.id]?.done).length;
  const total = goal.milestones.length;

  return (
    <div className="mb-2">
      <div className="w-full flex items-center gap-2 py-1.5 group">
        <button onClick={() => onToggle(goal.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          {isOpen ? <ChevronDown size={14} color={COLORS.inkFaint} /> : <ChevronRight size={14} color={COLORS.inkFaint} />}
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: goal.color }} />
          <span className="text-sm font-medium flex-1 truncate">{goal.title}</span>
        </button>
        <span className="font-mono text-[11px] flex-shrink-0" style={{ color: COLORS.inkFaint }}>
          {doneCount}/{total}
        </span>
        <button
          onClick={() => onEditGoal(goal)}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          aria-label="Edit goal"
        >
          <Pencil size={12} color={COLORS.inkFaint} />
        </button>
      </div>

      {isOpen && (
        <MilestoneList
          goal={goal}
          milestoneStats={milestoneStats}
          onMilestoneClick={(m) => onMilestoneClick(goal, m)}
          onAddMilestone={() => onAddMilestone(goal)}
        />
      )}
    </div>
  );
}
