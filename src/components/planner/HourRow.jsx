import React, { useState } from "react";
import { Plus } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { formatHour } from "../../utils/date";
import TaskCard from "./TaskCard";
import QuickAddForm from "./QuickAddForm";

export default function HourRow({
  hour,
  tasks,
  goals,
  goalColor,
  onDrop,
  onDragStartTask,
  onToggleTaskDone,
  onDeleteTask,
  onStopRepeating,
  onAddTask,
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(hour)}
      className="flex gap-3 group"
      style={{ borderTop: `1px solid ${COLORS.line}`, minHeight: "56px" }}
    >
      <div className="font-mono text-[11px] pt-2 w-16 flex-shrink-0 text-right" style={{ color: COLORS.inkFaint }}>
        {formatHour(hour)}
      </div>
      <div className="flex-1 py-1.5 flex flex-col gap-1.5">
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            color={goalColor(t.goalId)}
            onDragStart={() => onDragStartTask(t.id)}
            onToggleDone={() => onToggleTaskDone(t.id)}
            onDelete={() => onDeleteTask(t.id)}
            onStopRepeating={onStopRepeating}
          />
        ))}

        {adding ? (
          <QuickAddForm
            goals={goals}
            onCancel={() => setAdding(false)}
            onSubmit={(payload) => {
              onAddTask({ ...payload, hour });
              setAdding(false);
            }}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs py-1"
            style={{ color: COLORS.inkFaint }}
          >
            <Plus size={12} /> Add task or event
          </button>
        )}
      </div>
    </div>
  );
}
