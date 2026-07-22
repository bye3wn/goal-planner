import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { COLORS } from "../../constants/theme";

export default function QuickAddForm({ goals, onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [contribution, setContribution] = useState("");

  const selectedGoal = goals.find((g) => g.id === goalId);
  const selectedMilestone = selectedGoal?.milestones.find((m) => m.id === milestoneId);

  function submit() {
    if (!title.trim()) return;
    onSubmit({
      title,
      goalId: goalId || null,
      milestoneId: milestoneId || null,
      repeat,
      contributionAmount: selectedMilestone?.target && contribution ? Number(contribution) : null,
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !selectedMilestone?.target && submit()}
          placeholder="What are you doing?"
          className="text-sm px-2 py-1.5 rounded-md border outline-none flex-1"
          style={{ borderColor: COLORS.line }}
        />
        <select
          value={goalId}
          onChange={(e) => {
            setGoalId(e.target.value);
            setMilestoneId("");
          }}
          className="text-xs px-1.5 py-1.5 rounded-md border outline-none"
          style={{ borderColor: COLORS.line, color: COLORS.inkFaint }}
        >
          <option value="">No goal</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
        <button onClick={submit}>
          <Check size={16} color={COLORS.forest} />
        </button>
        <button onClick={onCancel}>
          <X size={16} color={COLORS.inkFaint} />
        </button>
      </div>

      {selectedGoal && selectedGoal.milestones.length > 0 && (
        <select
          value={milestoneId}
          onChange={(e) => setMilestoneId(e.target.value)}
          className="text-xs px-1.5 py-1 rounded-md border outline-none self-start"
          style={{ borderColor: COLORS.line, color: COLORS.inkFaint }}
        >
          <option value="">No specific waypoint</option>
          {selectedGoal.milestones.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
      )}

      {selectedMilestone?.target && (
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: COLORS.inkFaint }}>
          Counts toward
          <input
            type="number"
            min="1"
            value={contribution}
            onChange={(e) => setContribution(e.target.value)}
            placeholder="5"
            className="text-[12px] px-1.5 py-1 rounded-md border outline-none w-14"
            style={{ borderColor: COLORS.line }}
          />
          {selectedMilestone.target.unit} ({selectedMilestone.target.amount - selectedMilestone.progress} left)
        </div>
      )}

      <label className="flex items-center gap-1.5 text-[11px]" style={{ color: COLORS.inkFaint }}>
        <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />
        Repeat this every day
      </label>
    </div>
  );
}
