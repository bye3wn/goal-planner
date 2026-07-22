import React, { useEffect, useState } from "react";
import { X, Trash2, CalendarClock, ListChecks } from "lucide-react";
import { COLORS, TIME_SLOTS, DURATION_OPTIONS, REPEAT_OPTIONS, WEEKDAYS, ALL_WEEKDAYS } from "../../constants/theme";
import { formatTime, formatDuration } from "../../utils/date";

const EMPTY = {
  kind: "event",
  title: "",
  start: 9,
  duration: 1,
  goalId: "",
  milestoneId: "",
  contributionAmount: "",
  repeatType: "none", // "none" | "daily" | "custom"
  daysOfWeek: [],
};

// The "bigger box" — used for both creating a new item and editing an
// existing one. Opened from the calendar grid, the tasks panel, or by
// clicking an existing item.
export default function ItemModal({ open, initial, goals, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm({ ...EMPTY, ...initial });
  }, [open, initial]);

  if (!open) return null;

  const selectedGoal = goals.find((g) => g.id === form.goalId);
  const selectedMilestone = selectedGoal?.milestones.find((m) => m.id === form.milestoneId);
  const isManualCountdown = selectedMilestone?.target?.mode === "manual";
  const isEditing = !!initial?.id;

  function set(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function toggleDay(day) {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day) ? f.daysOfWeek.filter((d) => d !== day) : [...f.daysOfWeek, day].sort(),
    }));
  }

  function submit() {
    if (!form.title.trim()) return;
    let repeat = null;
    if (form.repeatType === "daily") repeat = { daysOfWeek: ALL_WEEKDAYS };
    else if (form.repeatType === "custom" && form.daysOfWeek.length > 0) repeat = { daysOfWeek: form.daysOfWeek };

    onSave(
      {
        kind: form.kind,
        title: form.title,
        start: form.kind === "event" ? Number(form.start) : null,
        duration: form.kind === "event" ? Number(form.duration) : null,
        goalId: form.goalId || null,
        milestoneId: form.milestoneId || null,
        contributionAmount: isManualCountdown && form.contributionAmount ? Number(form.contributionAmount) : null,
        repeat,
      },
      initial?.id
    );
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(35,41,32,0.35)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl shadow-xl overflow-hidden" style={{ background: COLORS.panel }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
          <span className="font-display text-lg" style={{ color: COLORS.forest }}>
            {isEditing ? "Edit item" : "New item"}
          </span>
          <button onClick={onClose}>
            <X size={18} color={COLORS.inkFaint} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <input
            autoFocus
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Title"
            className="text-base px-3 py-2 rounded-md border outline-none"
            style={{ borderColor: COLORS.line }}
          />

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.inkFaint }}>
              Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => set({ kind: "event" })}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-md border"
                style={{
                  borderColor: form.kind === "event" ? COLORS.forest : COLORS.line,
                  background: form.kind === "event" ? COLORS.forest : "transparent",
                  color: form.kind === "event" ? "#fff" : COLORS.ink,
                }}
              >
                <CalendarClock size={14} /> Event (has a time)
              </button>
              <button
                onClick={() => set({ kind: "task" })}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-md border"
                style={{
                  borderColor: form.kind === "task" ? COLORS.forest : COLORS.line,
                  background: form.kind === "task" ? COLORS.forest : "transparent",
                  color: form.kind === "task" ? "#fff" : COLORS.ink,
                }}
              >
                <ListChecks size={14} /> Task (checklist)
              </button>
            </div>
          </div>

          {form.kind === "event" && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.inkFaint }}>
                  Start time
                </label>
                <select value={form.start} onChange={(e) => set({ start: Number(e.target.value) })} className="w-full text-sm px-3 py-2 rounded-md border outline-none" style={{ borderColor: COLORS.line }}>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{formatTime(t)}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.inkFaint }}>
                  Duration
                </label>
                <select value={form.duration} onChange={(e) => set({ duration: Number(e.target.value) })} className="w-full text-sm px-3 py-2 rounded-md border outline-none" style={{ borderColor: COLORS.line }}>
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>{formatDuration(d)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.inkFaint }}>
                Goal
              </label>
              <select
                value={form.goalId}
                onChange={(e) => set({ goalId: e.target.value, milestoneId: "", contributionAmount: "" })}
                className="w-full text-sm px-3 py-2 rounded-md border outline-none"
                style={{ borderColor: COLORS.line }}
              >
                <option value="">No goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
            {selectedGoal && selectedGoal.milestones.length > 0 && (
              <div className="flex-1">
                <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.inkFaint }}>
                  Waypoint
                </label>
                <select
                  value={form.milestoneId}
                  onChange={(e) => set({ milestoneId: e.target.value, contributionAmount: "" })}
                  className="w-full text-sm px-3 py-2 rounded-md border outline-none"
                  style={{ borderColor: COLORS.line }}
                >
                  <option value="">None</option>
                  {selectedGoal.milestones.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isManualCountdown && (
            <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-md" style={{ background: COLORS.canvas }}>
              <span style={{ color: COLORS.inkFaint }}>Counts as</span>
              <input
                type="number"
                min="1"
                value={form.contributionAmount}
                onChange={(e) => set({ contributionAmount: e.target.value })}
                placeholder="5"
                className="text-sm px-2 py-1 rounded-md border outline-none w-16"
                style={{ borderColor: COLORS.line }}
              />
              <span style={{ color: COLORS.inkFaint }}>
                {selectedMilestone.target.unit} toward {selectedMilestone.target.amount - selectedMilestone.progress} left
              </span>
            </div>
          )}

          {selectedMilestone?.target?.mode === "daily" && (
            <p className="text-xs px-3 py-2 rounded-md" style={{ background: COLORS.canvas, color: COLORS.inkFaint }}>
              Checking this off counts as one day toward "{selectedMilestone.title}" automatically.
            </p>
          )}

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.inkFaint }}>
              Repeat
            </label>
            <select
              value={form.repeatType}
              onChange={(e) => set({ repeatType: e.target.value, daysOfWeek: e.target.value === "custom" ? form.daysOfWeek : [] })}
              className="w-full text-sm px-3 py-2 rounded-md border outline-none"
              style={{ borderColor: COLORS.line }}
            >
              {REPEAT_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            {form.repeatType === "custom" && (
              <div className="flex gap-1.5 mt-2">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => toggleDay(d.value)}
                    className="w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center"
                    style={{
                      border: `1px solid ${COLORS.line}`,
                      background: form.daysOfWeek.includes(d.value) ? COLORS.forest : "transparent",
                      color: form.daysOfWeek.includes(d.value) ? "#fff" : COLORS.ink,
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          {isEditing ? (
            <button onClick={() => { onDelete(initial.id); onClose(); }} className="flex items-center gap-1.5 text-sm" style={{ color: COLORS.blaze }}>
              <Trash2 size={14} /> Delete
            </button>
          ) : <span />}
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
