import React, { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { COLORS, GOAL_PALETTE } from "../../constants/theme";

const EMPTY = { title: "", color: GOAL_PALETTE[0].hex, deadline: "" };

// Same "bigger box" pattern as the item/milestone modals — used both to
// create a new long-term goal and to edit or delete an existing one.
// deadline is optional; setting it is what unlocks a milestone's
// "daily until deadline" percentage mode.
export default function GoalModal({ open, initial, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) {
      setForm(initial?.id ? { title: initial.title, color: initial.color, deadline: initial.deadline || "" } : EMPTY);
    }
  }, [open, initial]);

  if (!open) return null;

  const isEditing = !!initial?.id;

  function set(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function submit() {
    if (!form.title.trim()) return;
    onSave(form.title, form.color, form.deadline || null, initial?.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(35,41,32,0.35)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl shadow-xl overflow-hidden" style={{ background: COLORS.panel }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
          <span className="font-display text-lg" style={{ color: COLORS.forest }}>
            {isEditing ? "Edit goal" : "New long-term goal"}
          </span>
          <button onClick={onClose}>
            <X size={18} color={COLORS.inkFaint} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          <input
            autoFocus
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="A long-term goal..."
            className="text-base px-3 py-2 rounded-md border outline-none"
            style={{ borderColor: COLORS.line }}
          />

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.inkFaint }}>
              Color
            </label>
            <div className="flex items-center gap-1.5">
              {GOAL_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => set({ color: c.hex })}
                  className="w-6 h-6 rounded-full flex-shrink-0"
                  style={{ background: c.hex, outline: form.color === c.hex ? `2px solid ${COLORS.ink}` : "none", outlineOffset: "2px" }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.inkFaint }}>
              Deadline (optional)
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => set({ deadline: e.target.value })}
              className="w-full text-sm px-3 py-2 rounded-md border outline-none"
              style={{ borderColor: COLORS.line }}
            />
            <p className="text-[11px] mt-1" style={{ color: COLORS.inkFaint }}>
              Lets a milestone under this goal track "days completed out of days until deadline."
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          {isEditing ? (
            <button
              onClick={() => {
                onDelete(initial.id);
                onClose();
              }}
              className="flex items-center gap-1.5 text-sm"
              style={{ color: COLORS.blaze }}
            >
              <Trash2 size={14} /> Delete goal
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-md" style={{ color: COLORS.inkFaint }}>
              Cancel
            </button>
            <button onClick={submit} className="text-sm px-4 py-1.5 rounded-md text-white" style={{ background: COLORS.forest }}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
