import React, { useState } from "react";
import { Circle, CheckCircle2, Plus, Check, X } from "lucide-react";
import { COLORS } from "../../constants/theme";

export default function MilestoneList({ goal, onToggleMilestone, onAddMilestone }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [hasTarget, setHasTarget] = useState(false);
  const [targetAmount, setTargetAmount] = useState("");
  const [targetUnit, setTargetUnit] = useState("");

  // Progress bar reflects: quantity milestones use progress/target;
  // plain milestones use doneCount/total as before.
  const quantityMilestones = goal.milestones.filter((m) => m.target);
  const plainMilestones = goal.milestones.filter((m) => !m.target);
  const doneCount = plainMilestones.filter((m) => m.done).length + quantityMilestones.filter((m) => m.done).length;
  const total = goal.milestones.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  function submit() {
    if (!draft.trim()) return;
    onAddMilestone(goal.id, draft, hasTarget ? targetAmount : null, hasTarget ? targetUnit : null);
    setDraft("");
    setTargetAmount("");
    setTargetUnit("");
    setHasTarget(false);
    setAdding(false);
  }

  return (
    <div className="ml-[19px] pl-4 flex flex-col gap-1.5 py-1" style={{ borderLeft: `2px dashed ${COLORS.line}` }}>
      <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: COLORS.line }}>
        <div className="h-full" style={{ width: `${pct}%`, background: goal.color }} />
      </div>

      {goal.milestones.map((m) =>
        m.target ? (
          // Quantity-target milestone: driven by contributing tasks, not a
          // manual click. Shows "X remaining" instead of a plain checkbox.
          <div key={m.id} className="flex items-center gap-2 py-0.5">
            {m.done ? (
              <CheckCircle2 size={14} color={goal.color} className="flex-shrink-0" />
            ) : (
              <Circle size={14} color={COLORS.inkFaint} className="flex-shrink-0" />
            )}
            <span
              className="text-[13px] flex-1"
              style={{ color: m.done ? COLORS.inkFaint : COLORS.ink, textDecoration: m.done ? "line-through" : "none" }}
            >
              {m.title}
            </span>
            <span className="font-mono text-[10px] flex-shrink-0" style={{ color: COLORS.inkFaint }}>
              {m.done ? "done" : `${m.target.amount - m.progress} ${m.target.unit} left`}
            </span>
          </div>
        ) : (
          <button key={m.id} onClick={() => onToggleMilestone(goal.id, m.id)} className="flex items-center gap-2 text-left py-0.5">
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
        )
      )}

      {adding ? (
        <div className="flex flex-col gap-1.5 mt-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !hasTarget && submit()}
            placeholder="New waypoint..."
            className="text-[13px] px-2 py-1 rounded-md border outline-none"
            style={{ borderColor: COLORS.line }}
          />
          <label className="flex items-center gap-1.5 text-[11px]" style={{ color: COLORS.inkFaint }}>
            <input type="checkbox" checked={hasTarget} onChange={(e) => setHasTarget(e.target.checked)} />
            Track as a quantity (e.g. "30 applications") instead of a single checkbox
          </label>
          {hasTarget && (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="30"
                className="text-[13px] px-2 py-1 rounded-md border outline-none w-16"
                style={{ borderColor: COLORS.line }}
              />
              <input
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                placeholder="applications"
                className="text-[13px] px-2 py-1 rounded-md border outline-none flex-1"
                style={{ borderColor: COLORS.line }}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={submit}>
              <Check size={14} color={COLORS.forest} />
            </button>
            <button onClick={() => setAdding(false)}>
              <X size={14} color={COLORS.inkFaint} />
            </button>
          </div>
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
