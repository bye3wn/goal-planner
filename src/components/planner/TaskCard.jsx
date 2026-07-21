import React from "react";
import { GripVertical, Circle, CheckCircle2, X } from "lucide-react";
import { COLORS } from "../../constants/theme";

export default function TaskCard({ task, color, onDragStart, onToggleDone, onDelete }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-grab active:cursor-grabbing"
      style={{
        background: task.done ? "#F4F3EE" : COLORS.panel,
        border: `1px solid ${COLORS.line}`,
        borderLeft: `3px solid ${color}`,
        opacity: task.done ? 0.55 : 1,
      }}
    >
      <GripVertical size={13} color={COLORS.inkFaint} className="flex-shrink-0" />
      <button onClick={onToggleDone} className="flex-shrink-0">
        {task.done ? <CheckCircle2 size={15} color={color} /> : <Circle size={15} color={COLORS.inkFaint} />}
      </button>
      <span className="text-sm flex-1 truncate" style={{ textDecoration: task.done ? "line-through" : "none" }}>
        {task.title}
      </span>
      {task.duration > 1 && (
        <span className="font-mono text-[10px]" style={{ color: COLORS.inkFaint }}>
          {task.duration}h
        </span>
      )}
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <X size={13} color={COLORS.inkFaint} />
      </button>
    </div>
  );
}
