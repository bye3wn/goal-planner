import React, { useState } from "react";
import { Plus, X, GripVertical, Lock } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { formatDuration } from "../../utils/date";

// One draggable pre-made event. Grabbing it and dropping it on the week
// grid (see WeekGrid's onDropPreset) stamps out a real event instance
// there — the preset itself stays in this list so it can be reused for
// other days. onDragStart/onDragEnd bubble the preset up to App so
// WeekGrid (a sibling, not a descendant of this panel) knows what's being
// dragged and can render a live preview — dataTransfer's payload isn't
// readable during dragover, only at drop, so that's carried as plain
// component state instead.
function PresetCard({ preset, color, onDelete, onDragStart, onDragEnd }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("application/json", JSON.stringify({ type: "preset", presetId: preset.id }));
        onDragStart(preset);
      }}
      onDragEnd={onDragEnd}
      className="group flex items-center gap-1.5 px-2 py-1.5 rounded-md border cursor-grab active:cursor-grabbing"
      style={{ borderColor: COLORS.line, borderLeft: `3px solid ${color}`, background: COLORS.panel }}
      title="Drag onto the week grid to schedule it"
    >
      <GripVertical size={12} color={COLORS.inkFaint} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium truncate">{preset.title}</span>
          {preset.locked && <Lock size={9} color={COLORS.inkFaint} className="flex-shrink-0" />}
        </div>
        <div className="font-mono text-[10px]" style={{ color: COLORS.inkFaint }}>
          {formatDuration(preset.duration)}
        </div>
      </div>
      <button
        onClick={() => onDelete(preset.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/5"
        aria-label={`Delete ${preset.title} preset`}
      >
        <X size={12} color={COLORS.inkFaint} />
      </button>
    </div>
  );
}

function AddPresetForm({ goals, onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("1");
  const [goalId, setGoalId] = useState("");
  const [locked, setLocked] = useState(false);

  function submit() {
    const hours = Number(duration);
    if (!title.trim() || !hours || hours <= 0) return;
    onSubmit(title, hours, goalId || null, locked);
  }

  return (
    <div className="flex flex-col gap-1.5 mb-2 p-2 rounded-md border" style={{ borderColor: COLORS.line }}>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Event name"
        className="text-sm px-2 py-1 rounded-md border outline-none"
        style={{ borderColor: COLORS.line }}
      />
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0.25"
          step="0.25"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="text-xs px-1.5 py-1 rounded-md border outline-none w-16"
          style={{ borderColor: COLORS.line }}
        />
        <span className="text-[11px]" style={{ color: COLORS.inkFaint }}>
          hrs
        </span>
        <select
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
          className="text-xs px-1.5 py-1 rounded-md border outline-none flex-1 min-w-0"
          style={{ borderColor: COLORS.line, color: COLORS.inkFaint }}
        >
          <option value="">No goal</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-1.5 text-[11px]" style={{ color: COLORS.inkFaint }}>
        <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} />
        <Lock size={10} /> Fixed time (e.g. a class or meeting)
      </label>
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onCancel} className="text-xs px-2 py-1" style={{ color: COLORS.inkFaint }}>
          Cancel
        </button>
        <button onClick={submit} className="text-xs px-2 py-1 rounded-md" style={{ background: COLORS.forest, color: "#fff" }}>
          Add
        </button>
      </div>
    </div>
  );
}

// The week view's drag-and-drop source list — pre-made events you build
// once (title + duration + optional goal + whether it's fixed-time) and
// then drag onto any day/time slot in the week grid as many times as you
// like. Only shown alongside week view; day/month/year don't have a grid
// that makes sense to drop onto in the same way.
export default function EventPresetsPanel({ presets, goals, goalColor, onAddPreset, onDeletePreset, onPresetDragStart, onPresetDragEnd }) {
  const [adding, setAdding] = useState(false);

  return (
    <aside className="w-[220px] flex-shrink-0 overflow-y-auto px-4 py-5" style={{ borderLeft: `1px solid ${COLORS.line}` }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm tracking-wide uppercase" style={{ color: COLORS.inkFaint }}>
          Presets
        </h2>
        <button onClick={() => setAdding((a) => !a)} className="p-1 rounded-md hover:bg-black/5 transition-colors" aria-label="Add preset">
          <Plus size={16} />
        </button>
      </div>

      {adding && (
        <AddPresetForm
          goals={goals}
          onSubmit={(title, duration, goalId, locked) => {
            onAddPreset(title, duration, goalId, locked);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {presets.length === 0 && !adding && (
        <p className="text-xs" style={{ color: COLORS.inkFaint }}>
          No presets yet. Add one, then drag it onto the week.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {presets.map((p) => (
          <PresetCard
            key={p.id}
            preset={p}
            color={goalColor(p.goalId)}
            onDelete={onDeletePreset}
            onDragStart={onPresetDragStart}
            onDragEnd={onPresetDragEnd}
          />
        ))}
      </div>
    </aside>
  );
}
