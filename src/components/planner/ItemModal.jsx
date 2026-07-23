import React, { useEffect, useState } from "react";
import { X, Trash2, CalendarClock, ListChecks, Circle, CheckCircle2, ChevronDown } from "lucide-react";
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
  linkedTaskIds: [],
};

// The "bigger box" — used for both creating a new item and editing an
// existing one. Opened from the calendar grid, the tasks panel, or by
// clicking an existing item.
//
// dayTasks: the current day's task-kind items, offered as attachable
// subtasks when editing an event (so you can see "what do I need to get
// done during this" right on the event itself). onToggleTaskDone lets you
// check them off from here directly, same as the tasks panel.
export default function ItemModal({ open, initial, goals, dayTasks, onToggleTaskDone, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...initial, linkedTaskIds: initial?.linkedTaskIds || [] });
      setShowTitleDropdown(false);
    }
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

  function toggleLinkedTask(taskId) {
    setForm((f) => ({
      ...f,
      linkedTaskIds: f.linkedTaskIds.includes(taskId) ? f.linkedTaskIds.filter((id) => id !== taskId) : [...f.linkedTaskIds, taskId],
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
        linkedTaskIds: form.kind === "event" ? form.linkedTaskIds : [],
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

        <div className="px-5 py-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto" onClick={() => showTitleDropdown && setShowTitleDropdown(false)}>
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Title"
                className="flex-1 text-base px-3 py-2 rounded-md border outline-none"
                style={{ borderColor: COLORS.line }}
              />
              {goals.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTitleDropdown((o) => !o);
                  }}
                  className="p-2 rounded-md border flex-shrink-0"
                  style={{ borderColor: COLORS.line }}
                  title="Use a goal's name"
                >
                  <ChevronDown size={16} color={COLORS.inkFaint} />
                </button>
              )}
            </div>
            {showTitleDropdown && (
              <div
                className="absolute z-10 mt-1 left-0 right-0 rounded-md border shadow-lg overflow-hidden"
                style={{ background: COLORS.panel, borderColor: COLORS.line }}
              >
                {goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      set({ title: g.title, goalId: g.id, milestoneId: "", contributionAmount: "" });
                      setShowTitleDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm hover:bg-black/5"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: g.color }} />
                    {g.title}
                  </button>
                ))}
              </div>
            )}
          </div>

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

          {form.kind === "event" && (
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.inkFaint }}>
                Tasks to complete during this event
              </label>
              {(!dayTasks || dayTasks.length === 0) ? (
                <p className="text-xs" style={{ color: COLORS.inkFaint }}>
                  No tasks on the tasks panel for this day yet.
                </p>
              ) : (
                <div className="flex flex-col gap-1 rounded-md border p-2" style={{ borderColor: COLORS.line }}>
                  {dayTasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 py-0.5">
                      <input
                        type="checkbox"
                        checked={form.linkedTaskIds.includes(t.id)}
                        onChange={() => toggleLinkedTask(t.id)}
                        title="Attach to this event"
                      />
                      <button onClick={() => onToggleTaskDone(t.id)} className="flex-shrink-0" title="Mark done">
                        {t.done ? <CheckCircle2 size={14} color={COLORS.forest} /> : <Circle size={14} color={COLORS.inkFaint} />}
                      </button>
                      <span className="text-sm flex-1 truncate" style={{ textDecoration: t.done ? "line-through" : "none", color: t.done ? COLORS.inkFaint : COLORS.ink }}>
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
