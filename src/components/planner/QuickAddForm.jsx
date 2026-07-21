import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { COLORS } from "../../constants/theme";

export default function QuickAddForm({ goals, onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState("");

  function submit() {
    if (!title.trim()) return;
    onSubmit({ title, goalId: goalId || null });
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="What are you doing?"
        className="text-sm px-2 py-1.5 rounded-md border outline-none flex-1"
        style={{ borderColor: COLORS.line }}
      />
      <select
        value={goalId}
        onChange={(e) => setGoalId(e.target.value)}
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
  );
}
