import React, { useState } from "react";
import { Circle, CheckCircle2, Plus, Check, X } from "lucide-react";
import { COLORS } from "../../constants/theme";

export default function MilestoneList({ goal, milestoneStats, onAddMilestone }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState("checklist"); // "checklist" | "countdown"
  const [targetAmount, setTargetAmount] = useState("");
  const [targetUnit, setTargetUnit] = useState("");

  const doneCount = goal.milestones.filter((m) => milestoneStats[m.id]?.done).length;
  const total = goal.milestones.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  function submit() {
    if (!draft.trim()) return;
    if (mode === "countdown" && !(Number(targetAmount) > 0)) return;
    onAddMilestone(goal.id, draft, mode === "countdown" ? targetAmount : null, mode === "countdown" ? targetUnit : null);
    setDraft("");
    setTargetAmount("");
    setTargetUnit("");
    setMode("checklist");
    setAdding(false);
  }

  return (
    <div className="ml-[19px] pl-4 flex flex-col gap-1.5 py-1" style={{ borderLeft: `2px dashed ${COLORS.line}` }}>
      <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: COLORS.line }}>
        <div className="h-full" style={{ width: `${pct}%`, background: goal.color }} />
      </div>

      {goal.milestones.map((m) => {
        const stats = milestoneStats[m.id] || { done: false, label: "" };
        return (
          // Not a button — milestones aren't clickable. They complete
          // themselves based on their subtasks in the day planner.
          <div key={m.id} className="flex items-center gap-2 py-0.5">
            {stats.done ? (
              <CheckCircle2 size={14} color={goal.color} className="flex-shrink-0" />
            ) : (
              <Circle size={14} color={COLORS.inkFaint} className="flex-shrink-0" />
            )}
            <span
              className="text-[13px] flex-1"
              style={{ color: stats.done ? COLORS.inkFaint : COLORS.ink, textDecoration: stats.done ? "line-through" : "none" }}
            >
              {m.title}
            </span>
            <span className="font-mono text-[10px] flex-shrink-0" style={{ color: COLORS.inkFaint }}>
              {stats.label}
            </span>
          </div>
        );
      })}

      {adding ? (
        <div className="flex flex-col gap-2 mt-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="New waypoint..."
            className="text-[13px] px-2 py-1 rounded-md border outline-none"
            style={{ borderColor: COLORS.line }}
          />

          <div className="flex flex-col gap-1 text-[11px]" style={{ color: COLORS.inkFaint }}>
            <label className="flex items-start gap-1.5">
              <input type="radio" name={`mode-${goal.id}`} checked={mode === "checklist"} onChange={() => setMode("checklist")} className="mt-0.5" />
              <span>
                <strong style={{ color: COLORS.ink }}>Checklist</strong> — complete once its subtasks are done (e.g. "Rebuild resume")
              </span>
            </label>
            <label className="flex items-start gap-1.5">
              <input type="radio" name={`mode-${goal.id}`} checked={mode === "countdown"} onChange={() => setMode("countdown")} className="mt-0.5" />
              <span>
                <strong style={{ color: COLORS.ink }}>Countdown</strong> — track a number (e.g. "30 applications")
              </span>
            </label>
          </div>

          {mode === "countdown" && (
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
