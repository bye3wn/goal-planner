import React from "react";
import { Plus } from "lucide-react";
import { COLORS } from "../../constants/theme";
import GoalRow from "./GoalRow";

export default function Sidebar({ goals, expanded, milestoneStats, allItems, onToggleExpanded, onAddGoalClick, onEditGoal, onAddMilestone, onMilestoneClick, onToggleSubtaskDone }) {
  return (
    <aside
      className="w-[320px] flex-shrink-0 overflow-y-auto px-5 py-5"
      style={{ borderRight: `1px solid ${COLORS.line}`, background: COLORS.panel }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm tracking-wide uppercase" style={{ color: COLORS.inkFaint }}>
          Your path
        </h2>
        <button onClick={onAddGoalClick} className="p-1 rounded-md hover:bg-black/5 transition-colors" aria-label="Add goal">
          <Plus size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {goals.map((goal) => (
          <GoalRow
            key={goal.id}
            goal={goal}
            isOpen={!!expanded[goal.id]}
            milestoneStats={milestoneStats}
            allItems={allItems}
            onToggle={onToggleExpanded}
            onEditGoal={onEditGoal}
            onAddMilestone={onAddMilestone}
            onMilestoneClick={onMilestoneClick}
            onToggleSubtaskDone={onToggleSubtaskDone}
          />
        ))}
      </div>
    </aside>
  );
}
