import React, { useState } from "react";
import { Plus } from "lucide-react";
import { COLORS } from "../../constants/theme";
import NewGoalForm from "./NewGoalForm";
import GoalRow from "./GoalRow";

export default function Sidebar({ goals, expanded, onToggleExpanded, onAddGoal, onAddMilestone, onToggleMilestone }) {
  const [addingGoal, setAddingGoal] = useState(false);

  return (
    <aside
      className="w-[320px] flex-shrink-0 overflow-y-auto px-5 py-5"
      style={{ borderRight: `1px solid ${COLORS.line}`, background: COLORS.panel }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm tracking-wide uppercase" style={{ color: COLORS.inkFaint }}>
          Your path
        </h2>
        <button onClick={() => setAddingGoal((o) => !o)} className="p-1 rounded-md hover:bg-black/5 transition-colors" aria-label="Add goal">
          <Plus size={16} />
        </button>
      </div>

      {addingGoal && (
        <NewGoalForm
          onSubmit={(title, color) => {
            onAddGoal(title, color);
            setAddingGoal(false);
          }}
          onCancel={() => setAddingGoal(false)}
        />
      )}

      <div className="flex flex-col gap-1">
        {goals.map((goal) => (
          <GoalRow
            key={goal.id}
            goal={goal}
            isOpen={!!expanded[goal.id]}
            onToggle={onToggleExpanded}
            onToggleMilestone={onToggleMilestone}
            onAddMilestone={onAddMilestone}
          />
        ))}
      </div>
    </aside>
  );
}
