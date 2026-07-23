import React, { useEffect, useState } from "react";
import { X, Trash2, Circle, CheckCircle2, Pencil, Plus } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { daysBetween, dateKey } from "../../utils/date";

const EMPTY = { title: "", mode: "checklist", amount: "", unit: "" };

// Milestones are edited/deleted here, same "bigger box" pattern as items.
// mode drives what other fields show:
//   checklist -> nothing else, completes when its subtasks are done
//   manual    -> amount + unit (e.g. 30 / "applications")
//   daily     -> no input needed; amount is computed from the goal's
//                deadline automatically
//
// subtasks/onAdd/onToggle/onDeleteSubtask/onEditSubtask: the milestone's
// linked tasks, manageable right here — add new ones, check them off,
// delete them, or open the full item editor for anything more (time,
// repeat, etc).
export default function MilestoneModal({ open, goal, initial, subtasks, onSave, onDelete, onAddSubtask, onToggleSubtaskDone, onDeleteSubtask, onEditSubtask, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [newSubtask, setNewSubtask] = useState("");
  const [newSubtaskAmount, setNewSubtaskAmount] = useState("");

  useEffect(() => {
    if (open) {
      setNewSubtask("");
      setNewSubtaskAmount("");
      if (initial?.id) {
        const mode = initial.target ? initial.target.mode : "checklist";
        setForm({
          title: initial.title,
          mode,
          amount: initial.target?.mode === "manual" ? initial.target.amount : "",
          unit: initial.target?.mode === "manual" ? initial.target.unit : "",
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, initial]);

  if (!open) return null;

  const isEditing = !!initial?.id;
  const anchorDate = initial?.target?.mode === "daily" ? initial.target.startDate : dateKey(new Date());
  const daysUntilDeadline = goal?.deadline ? Math.max(1, daysBetween(new Date(anchorDate), new Date(goal.deadline))) : null;

  function set(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function submit() {
    if (!form.title.trim()) return;
    if (form.mode === "manual" && !(Number(form.amount) > 0)) return;
    onSave(goal.id, form.title, form.mode, form.amount, form.unit, initial?.id);
    onClose();
  }

  function submitNewSubtask() {
    if (!newSubtask.trim()) return;
    onAddSubtask(newSubtask, form.mode === "manual" && newSubtaskAmount ? Number(newSubtaskAmount) : null);
    setNewSubtask("");
    setNewSubtaskAmount("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(35,41,32,0.35)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl shadow-xl overflow-hidden" style={{ background: COLORS.panel }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
          <span className="font-display text-lg" style={{ color: COLORS.forest }}>
            {isEditing ? "Edit waypoint" : "New waypoint"}
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
            placeholder="Waypoint title"
            className="text-base px-3 py-2 rounded-md border outline-none"
            style={{ borderColor: COLORS.line }}
          />

          <div className="flex flex-col gap-1.5 text-[13px]" style={{ color: COLORS.inkFaint }}>
            <label className="flex items-start gap-2">
              <input type="radio" name="milestone-mode" checked={form.mode === "checklist"} onChange={() => set({ mode: "checklist" })} className="mt-0.5" />
              <span><strong style={{ color: COLORS.ink }}>Checklist</strong> — done when its subtasks are done</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" name="milestone-mode" checked={form.mode === "manual"} onChange={() => set({ mode: "manual" })} className="mt-0.5" />
              <span><strong style={{ color: COLORS.ink }}>Countdown</strong> — track a number (e.g. "30 applications")</span>
            </label>
            <label className="flex items-start gap-2" style={{ opacity: goal?.deadline ? 1 : 0.5 }}>
              <input
                type="radio"
                name="milestone-mode"
                checked={form.mode === "daily"}
                disabled={!goal?.deadline}
                onChange={() => set({ mode: "daily" })}
                className="mt-0.5"
              />
              <span>
                <strong style={{ color: COLORS.ink }}>Daily until deadline</strong> — check it off each day; % is days
                completed out of days left
                {!goal?.deadline && <> (set a deadline on this goal first)</>}
              </span>
            </label>
          </div>

          {form.mode === "manual" && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => set({ amount: e.target.value })}
                placeholder="30"
                className="text-sm px-2 py-1.5 rounded-md border outline-none w-20"
                style={{ borderColor: COLORS.line }}
              />
              <input
                value={form.unit}
                onChange={(e) => set({ unit: e.target.value })}
                placeholder="applications"
                className="text-sm px-2 py-1.5 rounded-md border outline-none flex-1"
                style={{ borderColor: COLORS.line }}
              />
            </div>
          )}

          {form.mode === "daily" && goal?.deadline && (
            <p className="text-xs px-3 py-2 rounded-md" style={{ background: COLORS.canvas, color: COLORS.inkFaint }}>
              {daysUntilDeadline} days until this goal's deadline — that's the denominator for this milestone's
              percentage. It updates automatically if you change the goal's deadline later.
            </p>
          )}

          {isEditing && (
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.inkFaint }}>
                Subtasks
              </label>
              <div className="flex flex-col gap-1 rounded-md border p-2 mb-2" style={{ borderColor: COLORS.line }}>
                {subtasks.length === 0 && (
                  <span className="text-xs px-1 py-1" style={{ color: COLORS.inkFaint }}>
                    No subtasks yet — add one below.
                  </span>
                )}
                {subtasks.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 py-0.5 group">
                    <button onClick={() => onToggleSubtaskDone(s.id)} className="flex-shrink-0">
                      {s.done ? <CheckCircle2 size={15} color={COLORS.forest} /> : <Circle size={15} color={COLORS.inkFaint} />}
                    </button>
                    <span
                      className="text-sm flex-1 truncate"
                      style={{ textDecoration: s.done ? "line-through" : "none", color: s.done ? COLORS.inkFaint : COLORS.ink }}
                    >
                      {s.title}
                    </span>
                    {s.contributionAmount ? (
                      <span className="font-mono text-[10px] flex-shrink-0" style={{ color: COLORS.inkFaint }}>
                        +{s.contributionAmount}
                      </span>
                    ) : null}
                    <button onClick={() => onEditSubtask(s)} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" title="Full edit (time, repeat, etc.)">
                      <Pencil size={12} color={COLORS.inkFaint} />
                    </button>
                    <button onClick={() => onDeleteSubtask(s.id)} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={13} color={COLORS.inkFaint} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitNewSubtask()}
                  placeholder="New subtask..."
                  className="text-sm px-2 py-1.5 rounded-md border outline-none flex-1"
                  style={{ borderColor: COLORS.line }}
                />
                {form.mode === "manual" && (
                  <input
                    type="number"
                    min="1"
                    value={newSubtaskAmount}
                    onChange={(e) => setNewSubtaskAmount(e.target.value)}
                    placeholder="amt"
                    className="text-sm px-2 py-1.5 rounded-md border outline-none w-16"
                    style={{ borderColor: COLORS.line }}
                  />
                )}
                <button onClick={submitNewSubtask} className="p-1.5 rounded-md" style={{ background: COLORS.forest }}>
                  <Plus size={14} color="#fff" />
                </button>
              </div>
              <p className="text-[11px] mt-1" style={{ color: COLORS.inkFaint }}>
                Added here as a plain checklist task for today. Click the pencil on any subtask to set a specific time, make it repeat, etc.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          {isEditing ? (
            <button onClick={() => { onDelete(goal.id, initial.id); onClose(); }} className="flex items-center gap-1.5 text-sm" style={{ color: COLORS.blaze }}>
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
