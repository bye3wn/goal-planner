import React, { useState } from "react";
import { Circle, CheckCircle2, Plus, Check, X } from "lucide-react";
import { COLORS } from "../../constants/theme";

export default function MilestoneList({ goal, onToggleMilestone, onAddMilestone }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const doneCount = goal.milestones.filter((m) => m.done).length;
  const total = goal.milestones.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  function submit() {
    if (!draft.trim()) return;
    onAddMilestone(goal.id, draft);
    setDraft("");
    setAdding(false);
  }

  return (
    <div className="ml-[19px] pl-4 flex flex-col gap-1.5 py-1" style={{ borderLeft: `2px dashed ${COLORS.line}` }}>
      <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: COLORS.line }}>
        <div className="h-full" style={{ width: `${pct}%`, background: goal.color }} />
      </div>

      {goal.milestones.map((m) => (
        <button
          key={m.id}
          onClick={() => onToggleMilestone(goal.id, m.id)}
          className="flex items-center gap-2 text-left py-0.5"
        >
          {m.done ? (
            <CheckCircle2 size={14} color={goal.color} className="flex-shrink-0" />
          ) : (
            <Circle size={14} color={COLORS.inkFaint} className="flex-shrink-0" />
          )}
          <span
            className="text-[13px]"
            style={{ color: m.done ? COLORS.inkFaint : COLORS.ink, textDecoration: m.done ? "line-through" : "none" }}
          >
            {m.title}
          </span>
        </button>
      ))}

      {adding ? (
        <div className="flex items-center gap-1 mt-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="New waypoint..."
            className="text-[13px] px-2 py-1 rounded-md border outline-none flex-1"
            style={{ borderColor: COLORS.line }}
          />
          <button onClick={submit}>
            <Check size={14} color={COLORS.forest} />
          </button>
          <button onClick={() => setAdding(false)}>
            <X size={14} color={COLORS.inkFaint} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-[12px] mt-1 py-0.5"
          style={{ color: COLORS.inkFaint }}
        >
          <Plus size={12} /> Add waypoint
        </button>
      )}
    </div>
  );
}
