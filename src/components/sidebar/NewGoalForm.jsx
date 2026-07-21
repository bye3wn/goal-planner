import React, { useState } from "react";
import { COLORS, GOAL_PALETTE } from "../../constants/theme";

export default function NewGoalForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(GOAL_PALETTE[0].hex);

  function submit() {
    if (!title.trim()) return;
    onSubmit(title, color);
    setTitle("");
  }

  return (
    <div className="mb-5 p-3 rounded-lg" style={{ background: COLORS.canvas }}>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="A long-term goal..."
        className="w-full text-sm px-2 py-1.5 rounded-md border outline-none mb-2"
        style={{ borderColor: COLORS.line }}
      />
      <div className="flex items-center gap-1.5 mb-2">
        {GOAL_PALETTE.map((c) => (
          <button
            key={c.hex}
            onClick={() => setColor(c.hex)}
            className="w-5 h-5 rounded-full flex-shrink-0"
            style={{
              background: c.hex,
              outline: color === c.hex ? `2px solid ${COLORS.ink}` : "none",
              outlineOffset: "2px",
            }}
            aria-label={c.name}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={submit} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: COLORS.forest }}>
          Add goal
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded-md" style={{ color: COLORS.inkFaint }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
